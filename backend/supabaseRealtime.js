const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let subscription = null;

/**
 * Initialize Supabase Realtime subscription for the `guias` table.
 * Requires SUPABASE_URL and SUPABASE_ANON_KEY (or SERVICE_ROLE if needed) in env.
 */
function initSupabaseRealtime({ url, key, appEmitter = null } = {}){
  if(!url || !key){
    console.warn('Supabase realtime not initialized: missing url or key');
    return null;
  }
  try{
    supabase = createClient(url, key, { realtime: { params: { eventsPerSecond: 10 } } });

    // Subscribe to all changes on public.guis (public schema, table 'guias')
    // Using the `channel` + `on('postgres_changes')` API
    subscription = supabase
      .channel('public:guias')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guias' }, payload => {
        try{
          console.log('[supabase][realtime] guias event:', payload.event, payload.record || payload.new || payload.old || payload);
          if(appEmitter && typeof appEmitter.emit === 'function'){
            // emit an app-level event so the rest of the server can react
            appEmitter.emit('supabase:guias', payload);
          }
        }catch(e){ console.warn('Error handling realtime payload', e && e.message ? e.message : e); }
      })
      .subscribe(status => {
        console.log('[supabase][realtime] subscription status:', status);
      });

    console.log('Supabase realtime initialized for guias');
    return { supabase, subscription };
  }catch(e){
    console.warn('Failed to initialize supabase realtime:', e && e.message ? e.message : e);
    return null;
  }
}

function stopSupabaseRealtime(){
  try{
    if(subscription && supabase){
      supabase.removeChannel(subscription);
      subscription = null;
    }
    supabase = null;
  }catch(e){ /* ignore */ }
}

module.exports = { initSupabaseRealtime, stopSupabaseRealtime };
