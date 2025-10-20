import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGooglePopup() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // result.user contains user info
    return { user: result.user };
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
    return { user: result.user };
  } catch (err) {
    return { error: err };
  }
}
