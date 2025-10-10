const path = require('path');
// Load .env from backend folder if present
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch(e) { /* ignore */ }
const WebSocket = require('ws');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY in environment');
  process.exit(1);
}

const wsUrl = url.replace(/^http/, 'ws').replace(/\/$/, '') + `/realtime/v1?apikey=${encodeURIComponent(key)}`;
console.log('Attempting WebSocket connection to:', wsUrl.replace(/(apikey=)([^&]+)/, '$1[REDACTED]'));

const ws = new WebSocket(wsUrl, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`
  }
});

let opened = false;

ws.on('open', function open() {
  opened = true;
  console.log('WebSocket open');
  // send a minimal ping or unsubscribe if needed
  setTimeout(() => {
    console.log('Closing after successful open');
    ws.close(1000, 'test done');
  }, 2000);
});

ws.on('message', function message(data) {
  console.log('Message:', data.toString());
});

ws.on('close', function close(code, reason) {
  console.log('WebSocket closed. code=', code, 'reason=', reason && reason.toString ? reason.toString() : reason);
  process.exit(opened ? 0 : 2);
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err && err.message ? err.message : err);
  if (err && err.response) {
    console.error('Response status:', err.response.statusCode, 'headers:', err.response.headers);
  }
  process.exit(3);
});

// Timeout to avoid hanging
setTimeout(() => {
  console.error('WebSocket test timed out after 10s');
  try { ws.terminate(); } catch(e){}
  process.exit(4);
}, 10000);
