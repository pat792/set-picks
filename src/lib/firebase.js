import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJskQFM62Fyr-EjxlGJD3svAhf9gp9CHI",
  authDomain: "set-picks.firebaseapp.com",
  projectId: "set-picks",
  storageBucket: "set-picks.firebasestorage.app",
  messagingSenderId: "927420107250",
  appId: "1:927420107250:web:1b9f52a72ef8dd9096836b",
  measurementId: "G-K3YZ8FNM3V"
};

const app = initializeApp(firebaseConfig);

// We export these so any file in the app can use them
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();