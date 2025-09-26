import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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
