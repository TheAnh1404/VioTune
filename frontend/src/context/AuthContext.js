import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);          // Firebase user object
  const [loading, setLoading] = useState(true);    // initial auth check

  // ── Listen to Firebase auth state ──────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Sign Up ─────────────────────────────────────────────────────────────────
  const signUp = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      displayName,
      email,
      createdAt: serverTimestamp(),
      likedSongs: [],
      playHistory: [],
      preferences: { genres: [] }
    });

    return cred.user;
  };

  // ── Sign In ─────────────────────────────────────────────────────────────────
  const signIn = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  // ── Sign Out ────────────────────────────────────────────────────────────────
  const logOut = () => signOut(auth);

  // ── Like / Unlike a Song ────────────────────────────────────────────────────
  const likeSong = async (track) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      likedSongs: arrayUnion({
        track_id: track.track_id,
        track_name: track.track_name,
        artists: track.artists,
        track_genre: track.track_genre || '',
        likedAt: new Date().toISOString()
      })
    });
  };

  const unlikeSong = async (trackId) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    // We store objects so we need to read first and filter
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const liked = (snap.data().likedSongs || []).filter(s => s.track_id !== trackId);
    await updateDoc(userRef, { likedSongs: liked });
  };

  // ── Get Liked Songs from Firestore ──────────────────────────────────────────
  const getLikedSongs = async () => {
    if (!user) return [];
    const snap = await getDoc(doc(db, 'users', user.uid));
    return snap.exists() ? (snap.data().likedSongs || []) : [];
  };

  // ── Record a song play in history ───────────────────────────────────────────
  const recordPlay = async (track) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const entry = {
      track_id: track.track_id,
      track_name: track.track_name,
      artists: track.artists,
      playedAt: new Date().toISOString()
    };
    // Keep last 50 plays in the array (append, then we trim via cloud logic or on read)
    const snap = await getDoc(userRef);
    const history = snap.exists() ? (snap.data().playHistory || []) : [];
    const updated = [entry, ...history].slice(0, 50);
    await updateDoc(userRef, { playHistory: updated });
  };

  // ── Get user play history ───────────────────────────────────────────────────
  const getPlayHistory = async () => {
    if (!user) return [];
    const snap = await getDoc(doc(db, 'users', user.uid));
    return snap.exists() ? (snap.data().playHistory || []) : [];
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    logOut,
    likeSong,
    unlikeSong,
    getLikedSongs,
    recordPlay,
    getPlayHistory
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
