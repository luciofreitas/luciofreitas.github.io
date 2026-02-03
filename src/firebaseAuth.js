// Lightweight wrapper that dynamically imports Firebase modules only when needed.
// This prevents the Firebase SDK from being bundled into the main chunk when
// the app doesn't need auth functionality on first paint.

async function ensureProvider() {
  // Dynamically import firebase core and auth module
  const [{ auth } = {}, authMod] = await Promise.all([
    import('./firebase').catch(() => ({})),
    import('firebase/auth').catch(() => ({})),
  ]);

  // Initialize provider each call (GoogleAuthProvider is lightweight)
  let GoogleAuthProvider = authMod && authMod.GoogleAuthProvider;
  if (!GoogleAuthProvider) {
    // If dynamic import failed, throw a descriptive error
    throw new Error('[firebaseAuth] firebase/auth module not available');
  }

  const provider = new GoogleAuthProvider();
  try { provider.addScope && provider.addScope('profile'); } catch (e) {}
  try { provider.addScope && provider.addScope('email'); } catch (e) {}
  try { provider.setCustomParameters && provider.setCustomParameters({ prompt: 'select_account' }); } catch (e) {}

  return { auth, authMod, provider };
}

export async function signInWithGooglePopup() {
  try {
    const { auth, authMod, provider } = await ensureProvider();
    if (!auth) return { error: new Error('[firebaseAuth] Firebase not configured (missing env vars)') };
    const { signInWithPopup } = authMod;
    const result = await signInWithPopup(auth, provider);
    let credential = null;
    try { credential = authMod.GoogleAuthProvider.credentialFromResult(result); } catch (e) { /* ignore */ }
    return { user: result.user, credential };
  } catch (err) {
    return { error: err };
  }
}

export async function startGoogleRedirect() {
  try {
    const { auth, authMod, provider } = await ensureProvider();
    if (!auth) return { error: new Error('[firebaseAuth] Firebase not configured (missing env vars)') };
    const { signInWithRedirect } = authMod;
    await signInWithRedirect(auth, provider);
    return { started: true };
  } catch (err) {
    return { error: err };
  }
}

export async function handleRedirectResult() {
  try {
    const { auth, authMod } = await ensureProvider();
    if (!auth) return { error: new Error('[firebaseAuth] Firebase not configured (missing env vars)') };
    const { getRedirectResult } = authMod;
    const result = await getRedirectResult(auth);
    if (!result) return { none: true };
    let credential = null;
    try { credential = authMod.GoogleAuthProvider.credentialFromResult(result); } catch (e) { /* ignore */ }
    return { user: result.user, credential };
  } catch (err) {
    return { error: err };
  }
}

export async function signOutFirebase() {
  try {
    const [{ auth } = {}, authMod] = await Promise.all([
      import('./firebase').catch(() => ({})),
      import('firebase/auth').catch(() => ({})),
    ]);
    if (!auth) return { ok: false, error: new Error('[firebaseAuth] Firebase not configured (missing env vars)') };
    if (!authMod || typeof authMod.signOut !== 'function') return { ok: false, error: new Error('[firebaseAuth] firebase/auth signOut not available') };
    await authMod.signOut(auth);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}
