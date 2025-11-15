// Firebase initialization (modular SDK)
import './shims/process';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Prefer Vite-style env (import.meta.env) when available, otherwise process.env
let viteEnv = null;
try {
  // Access import.meta safely; some tools may rewrite or throw on direct typeof checks
  viteEnv = (typeof import.meta !== 'undefined' && import.meta && import.meta.env) ? import.meta.env : null;
} catch (e) {
  viteEnv = null;
}
const nodeEnv = (typeof process !== 'undefined' && process.env) || {};

// Prefer runtime-config injected by server endpoint (window.__RUNTIME_CONFIG__)
// so builds do not need to embed values. Fallback to compile-time envs.
const runtimeCfg = (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) || {};

const firebaseConfig = {
  apiKey: runtimeCfg.FIREBASE_API_KEY || (viteEnv && viteEnv.VITE_FIREBASE_API_KEY) || nodeEnv.REACT_APP_FIREBASE_API_KEY || nodeEnv.FIREBASE_API_KEY,
  authDomain: runtimeCfg.FIREBASE_AUTH_DOMAIN || (viteEnv && viteEnv.VITE_FIREBASE_AUTH_DOMAIN) || nodeEnv.REACT_APP_FIREBASE_AUTH_DOMAIN || nodeEnv.FIREBASE_AUTH_DOMAIN,
  projectId: runtimeCfg.FIREBASE_PROJECT_ID || (viteEnv && viteEnv.VITE_FIREBASE_PROJECT_ID) || nodeEnv.REACT_APP_FIREBASE_PROJECT_ID || nodeEnv.FIREBASE_PROJECT_ID,
  storageBucket: runtimeCfg.FIREBASE_STORAGE_BUCKET || (viteEnv && viteEnv.VITE_FIREBASE_STORAGE_BUCKET) || nodeEnv.REACT_APP_FIREBASE_STORAGE_BUCKET || nodeEnv.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: runtimeCfg.FIREBASE_MESSAGING_SENDER_ID || (viteEnv && viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID) || nodeEnv.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || nodeEnv.FIREBASE_MESSAGING_SENDER_ID,
  appId: runtimeCfg.FIREBASE_APP_ID || (viteEnv && viteEnv.VITE_FIREBASE_APP_ID) || nodeEnv.REACT_APP_FIREBASE_APP_ID || nodeEnv.FIREBASE_APP_ID,
  measurementId: runtimeCfg.FIREBASE_MEASUREMENT_ID || (viteEnv && viteEnv.VITE_FIREBASE_MEASUREMENT_ID) || nodeEnv.REACT_APP_FIREBASE_MEASUREMENT_ID || nodeEnv.FIREBASE_MEASUREMENT_ID,
};

// Debug: print which env source provided the vars (mask actual values)
try {
  const isDev = !!(viteEnv && (viteEnv.DEV || viteEnv.VITE_DEBUG_FIREBASE === 'true')) || (nodeEnv && nodeEnv.NODE_ENV !== 'production' && nodeEnv.DEBUG_FIREBASE === 'true');
  const resolved = {
    apiKeySource: viteEnv && viteEnv.VITE_FIREBASE_API_KEY ? 'import.meta.env (VITE_)' : (nodeEnv.REACT_APP_FIREBASE_API_KEY || nodeEnv.FIREBASE_API_KEY) ? 'process.env' : 'none',
    authDomainSource: viteEnv && viteEnv.VITE_FIREBASE_AUTH_DOMAIN ? 'import.meta.env (VITE_)' : (nodeEnv.REACT_APP_FIREBASE_AUTH_DOMAIN || nodeEnv.FIREBASE_AUTH_DOMAIN) ? 'process.env' : 'none',
    projectIdSource: viteEnv && viteEnv.VITE_FIREBASE_PROJECT_ID ? 'import.meta.env (VITE_)' : (nodeEnv.REACT_APP_FIREBASE_PROJECT_ID || nodeEnv.FIREBASE_PROJECT_ID) ? 'process.env' : 'none',
    storageBucketSource: viteEnv && viteEnv.VITE_FIREBASE_STORAGE_BUCKET ? 'import.meta.env (VITE_)' : (nodeEnv.REACT_APP_FIREBASE_STORAGE_BUCKET || nodeEnv.FIREBASE_STORAGE_BUCKET) ? 'process.env' : 'none',
    appIdSource: viteEnv && viteEnv.VITE_FIREBASE_APP_ID ? 'import.meta.env (VITE_)' : (nodeEnv.REACT_APP_FIREBASE_APP_ID || nodeEnv.FIREBASE_APP_ID) ? 'process.env' : 'none',
  };
  // Only show non-secret diagnostics
  const maskedApiKey = (() => {
    const key = (viteEnv && viteEnv.VITE_FIREBASE_API_KEY) || nodeEnv.REACT_APP_FIREBASE_API_KEY || nodeEnv.FIREBASE_API_KEY || '';
    if (!key) return '(none)';
    return key.length > 8 ? `${key.slice(0,8)}...[masked]` : '[masked]';
  })();
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug('[firebase] env sources:', resolved, 'maskedApiKey:', maskedApiKey);
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.debug('[firebase] env debug failed', e && e.message);
}

// Guard: avoid calling initializeApp with empty/missing config.
// When the project is built/deployed without VITE_FIREBASE_* (or corresponding env vars),
// the Firebase SDK may attempt to fetch `/__/firebase/init.json` from the current origin.
// That can create 404s and repeated requests which slow down the app (observed in Network).
// If essential fields (apiKey + projectId + appId) are missing, skip initialization and
// export nulls so callers can detect the absence of a configured Firebase app.
const hasEssentialConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let app = null;
let auth = null;
if (!hasEssentialConfig) {
  // eslint-disable-next-line no-console
  console.error('[firebase] missing essential config (apiKey/projectId/appId). Skipping initializeApp to avoid /__/firebase/init.json requests.');
} else {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };
export default app;

// DEV-ONLY: attach auth to window for interactive debugging in the browser console
// This helps quickly inspect `auth.currentUser` and call `getIdToken()` when
// running the Vite dev server. This must NOT run in production builds.
try {
  const isDev = !!(viteEnv && (viteEnv.DEV || viteEnv.VITE_DEBUG_FIREBASE === 'true')) || (nodeEnv && nodeEnv.NODE_ENV !== 'production' && nodeEnv.DEBUG_FIREBASE === 'true');
  if (typeof window !== 'undefined' && isDev) {
    // attach under a clearly-named property so it's easy to remove later
    // eslint-disable-next-line no-console
    console.info('[firebase] dev: exposing auth on window.__debugFirebaseAuth');
    // keep a non-enumerable property to avoid accidental serialization
    Object.defineProperty(window, '__debugFirebaseAuth', { value: auth, writable: false, configurable: true });
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.debug('[firebase] failed to attach debug auth', e && e.message);
}
