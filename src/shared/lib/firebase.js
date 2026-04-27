import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Custom auth domain rollout (issue #282): `authDomain` is the URL that
// signInWithPopup opens and that appears in Google's OAuth consent line.
// Leaving the fallback as `set-picks.firebaseapp.com` preserves today's
// behavior when the env var is unset. Flip by setting
// `VITE_FIREBASE_AUTH_DOMAIN=www.setlistpickem.com` in Vercel (Preview
// first, then Production) once the Firebase handler proxy in `vercel.json`
// is live. Removing the env var is a zero-code-change rollback.
const firebaseConfig = {
  apiKey: "AIzaSyAJskQFM62Fyr-EjxlGJD3svAhf9gp9CHI",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "set-picks.firebaseapp.com",
  projectId: "set-picks",
  /** Default Storage bucket (same as Firebase console → Storage). */
  storageBucket: "set-picks.firebasestorage.app",
  messagingSenderId: "927420107250",
  appId: "1:927420107250:web:1b9f52a72ef8dd9096836b",
  measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Storage, App Check, and GoogleAuthProvider are initialized lazily — see
// `firebaseStorage.js`, `firebaseAppCheck.js`, and
// `features/auth/api/splashAuthApi.js`. Keeping only the must-boot-eagerly
// singletons here keeps the splash critical path slim (issue #242).
export { app };
export const firebaseStorageBucket = firebaseConfig.storageBucket;
export const auth = getAuth(app);
export const db = getFirestore(app);
