import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

// Request commonly-used scopes and prefer showing the account chooser on web flows.
// On mobile we usually use redirect flows (popup is often blocked), but setting
// these ensures the consent/account-selection UI appears as expected when possible.
try {
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  // 'select_account' prompts the account chooser; use 'consent' if you need the
  // full consent screen every time (will force re-consent).
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (e) {
  // Defensive: ignore provider config failures in environments where firebase
  // objects behave differently (shouldn't happen in normal web builds).
  // eslint-disable-next-line no-console
  console.debug('[firebaseAuth] could not set provider scopes/params', e && e.message ? e.message : e);
}

export async function signInWithGooglePopup() {
  if (!auth) return { error: new Error('[firebaseAuth] Firebase not configured (missing env vars)') };
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Extract credential (OAuth) so caller can link accounts when needed
    let credential = null;
    try { credential = GoogleAuthProvider.credentialFromResult(result); } catch (e) { /* ignore */ }
    return { user: result.user, credential };
  } catch (err) {
    return { error: err };
  }
}

export async function startGoogleRedirect() {
  if (!auth) return { error: new Error('[firebaseAuth] Firebase not configured (missing env vars)') };
  try {
    await signInWithRedirect(auth, googleProvider);
    return { started: true };
  } catch (err) {
    return { error: err };
  }
}

export async function handleRedirectResult() {
  if (!auth) return { error: new Error('[firebaseAuth] Firebase not configured (missing env vars)') };
  try {
    console.log('[firebaseAuth] calling getRedirectResult...');
    const result = await getRedirectResult(auth);
    console.log('[firebaseAuth] getRedirectResult returned:', result ? 'user found' : 'no result');
    if (!result) return { none: true };
    let credential = null;
    try { credential = GoogleAuthProvider.credentialFromResult(result); } catch (e) { /* ignore */ }
    console.log('[firebaseAuth] returning user:', result.user?.email);
    return { user: result.user, credential };
  } catch (err) {
    console.error('[firebaseAuth] getRedirectResult error:', err);
    return { error: err };
  }
}
