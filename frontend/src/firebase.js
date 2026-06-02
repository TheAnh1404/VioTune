// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDfg87gFXYnAGRMO0j-dhHBOTj2IaoYFd4",
  authDomain: "viotuneteam6.firebaseapp.com",
  projectId: "viotuneteam6",
  storageBucket: "viotuneteam6.firebasestorage.app",
  messagingSenderId: "128179150459",
  appId: "1:128179150459:web:70ddf9babbb5645c304cde",
  measurementId: "G-6LYSJ4LY2J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);

export { app, analytics, auth };
