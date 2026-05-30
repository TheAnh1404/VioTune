// ─── Firebase Configuration for VioTune ───────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDfg87gFXYnAGRMO0j-dhHBOTj2IaoYFd4",
  authDomain: "viotuneteam6.firebaseapp.com",
  projectId: "viotuneteam6",
  storageBucket: "viotuneteam6.firebasestorage.app",
  messagingSenderId: "128179150459",
  appId: "1:128179150459:web:70ddf9babbb5645c304cde",
  measurementId: "G-6LYSJ4LY2J"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export default app;
