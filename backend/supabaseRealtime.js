const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let channel = null;
let stopped = false;
let retryTimer = null;

// Configuration for retries/backoff
const DEFAULT_MAX_RETRIES = 8;
const BASE_DELAY_MS = 2000; // initial backoff

function safeLog(...args){
  try{ console.log(...args); }catch(e){}
}

function clearExistingChannel(){
  try{
    if(channel && supabase){
      try { supabase.removeChannel(channel); } catch(e){ /* ignore */ }
    }
  }catch(e){ /* ignore */ }
  channel = null;
}

function scheduleRetry(attempt, appEmitter, url, key){
  if(stopped) return;
  const delay = Math.min(30000, BASE_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1)));
  safeLog(`[supabase][realtime] scheduling retry #${attempt} in ${delay}ms`);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    createAndSubscribe({ attempt, appEmitter, url, key }).catch(err => {
      safeLog('[supabase][realtime] retry createAndSubscribe error:', err && err.message ? err.message : err);
    });
  }, delay);
}

async function createAndSubscribe({ attempt = 1, maxRetries = DEFAULT_MAX_RETRIES, appEmitter = null, url, key } = {}){
  if(stopped) return;
  try{
    clearExistingChannel();

    channel = supabase
      .channel('public:guias')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guias' }, payload => {
        try{
          safeLog('[supabase][realtime] guias event:', payload.event, payload.record || payload.new || payload.old || payload);
          if(appEmitter && typeof appEmitter.emit === 'function'){
            appEmitter.emit('supabase:guias', payload);
          }
        }catch(e){ safeLog('[supabase][realtime] handler error:', e && e.message ? e.message : e); }
      });

    // Subscribe and handle status updates
    channel.subscribe((status, err) => {
      // Note: supabase-js may call subscribe callback with a status string
      try{
        safeLog('[supabase][realtime] subscription status:', status);
        // handle textual statuses (some SDK versions emit objects/strings)
        const s = (typeof status === 'string') ? status.toUpperCase() : (status && status.type ? String(status.type).toUpperCase() : '');

        if(s === 'TIMED_OUT' || s === 'CHANNEL_ERROR' || (err && err.message)){
          safeLog('[supabase][realtime] subscription reported problem:', s, err && err.message ? err.message : err);
          // decide whether to retry
          if(attempt < maxRetries){
            // cleanup and schedule a retry
            try { supabase.removeChannel(channel); } catch(e){}
            channel = null;
            scheduleRetry(attempt + 1, appEmitter, url, key);
            return;
          } else {
            safeLog('[supabase][realtime] max retries reached, giving up');
          }
        }

        // When successfully subscribed, log and reset retry counter
        if(s === 'SUBSCRIBED' || s === 'CHANNEL_OPEN' || s === 'OK'){
          safeLog('[supabase][realtime] subscribed successfully');
        }
      }catch(e){ safeLog('[supabase][realtime] subscribe callback error:', e && e.message ? e.message : e); }
    });

    // In addition, attempt a subscribe() call and inspect returned error (SDK variants)
    try{
      const subResult = await channel.subscribe();
      if(subResult && subResult.error){
        safeLog('[supabase][realtime] subscribe returned error:', subResult.error);
        if(attempt < maxRetries){
          try { supabase.removeChannel(channel); } catch(e){}
          channel = null;
          scheduleRetry(attempt + 1, appEmitter, url, key);
          return;
        }
      }
    }catch(e){
      safeLog('[supabase][realtime] subscribe() threw:', e && e.message ? e.message : e);
      if(attempt < maxRetries){
        try { supabase.removeChannel(channel); } catch(e){}
        channel = null;
        scheduleRetry(attempt + 1, appEmitter, url, key);
        return;
      }
    }

    // If we reached this point, subscription was initiated without immediate errors
    safeLog('[supabase][realtime] createAndSubscribe finished (attempt ' + attempt + ')');
    return channel;
  }catch(err){
    safeLog('[supabase][realtime] createAndSubscribe error:', err && err.message ? err.message : err);
    if(attempt < maxRetries){
      scheduleRetry(attempt + 1, appEmitter, url, key);
    }
    throw err;
  }
}

/**
 * Initialize Supabase Realtime subscription for the `guias` table.
 * This function starts background subscription attempts and returns immediately.
 */
function initSupabaseRealtime({ url, key, appEmitter = null } = {}){
  if(!url || !key){
    safeLog('Supabase realtime not initialized: missing url or key');
    return null;
  }

  try{
    // if already initialized, stop previous
    stopped = false;
    if(supabase && channel){
      try { supabase.removeChannel(channel); } catch(e){}
      channel = null;
    }

    supabase = createClient(url, key, { realtime: { params: { eventsPerSecond: 10 } } });
    // Start a background subscribe attempt with retry logic (non-blocking)
    createAndSubscribe({ attempt: 1, appEmitter, url, key }).catch(err => {
      safeLog('[supabase][realtime] initial createAndSubscribe error:', err && err.message ? err.message : err);
    });

    safeLog('Supabase realtime initialized for guias (background subscribe started)');
    return { supabase, channel };
  }catch(e){
    safeLog('Failed to initialize supabase realtime:', e && e.message ? e.message : e);
    return null;
  }
}

function stopSupabaseRealtime(){
  stopped = true;
  try{
    if(retryTimer){ clearTimeout(retryTimer); retryTimer = null; }
    if(channel && supabase){
      try { supabase.removeChannel(channel); } catch(e){}
      channel = null;
    }
  }catch(e){ /* ignore */ }
  // keep supabase client reference (caller can still use it or set to null)
}

module.exports = { initSupabaseRealtime, stopSupabaseRealtime };
