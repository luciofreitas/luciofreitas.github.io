import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGooglePopup() {
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
  try {
    await signInWithRedirect(auth, googleProvider);
    return { started: true };
  } catch (err) {
    return { error: err };
  }
}

export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return { none: true };
    let credential = null;
    try { credential = GoogleAuthProvider.credentialFromResult(result); } catch (e) { /* ignore */ }
    return { user: result.user, credential };
  } catch (err) {
    return { error: err };
  }
}
