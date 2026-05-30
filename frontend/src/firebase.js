// ─── Firebase Configuration for VioTune ───────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "viotune-music",
  appId: "1:939519872926:web:1791e7b753558be6cf908f",
  storageBucket: "viotune-music.firebasestorage.app",
  apiKey: "AIzaSyDCMRWAqGyc2lYISsMzRLmftFLo6IA706g",
  authDomain: "viotune-music.firebaseapp.com",
  messagingSenderId: "939519872926",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
