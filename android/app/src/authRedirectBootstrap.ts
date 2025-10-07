// src/authRedirectBootstrap.ts
import {
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithRedirect,
} from "firebase/auth";
import { auth } from "./firebase"; // <- adjust if your firebase init lives elsewhere

// call this once on app start
export async function initAuthBootstrap() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    console.error("Failed to set persistence", e);
  }

  // finish Google redirect after returning from Chrome → app
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log("Signed in via redirect:", result.user.uid);
      // OPTIONAL: route to your app home
      // window.location.replace("/dashboard");
    }
  } catch (e) {
    console.error("getRedirectResult error", e);
  }

  // keep your normal listener
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state:", !!user);
    // if (user) { /* show app */ } else { /* show login */ }
  });
}

// use this for your Google button
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
}
