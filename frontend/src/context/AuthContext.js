// ─── AuthContext cho VioTune với Firebase Authentication Client SDK ────────────────────────
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth';
import { API_URL } from '../config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);          // User object { uid, email, displayName }
  const [loading, setLoading] = useState(true);    // Initial auth check loading status
  const [likedSongsList, setLikedSongsList] = useState([]);
  const [likedSongIds, setLikedSongIds] = useState(new Set());

  // ── Lắng nghe sự thay đổi trạng thái đăng nhập từ Firebase Auth ──────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const u = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'VioTune User'
        };
        setUser(u);
        localStorage.setItem('viotune_user', JSON.stringify(u));
        
        // Tải danh sách bài hát yêu thích từ backend
        try {
          const res = await fetch(`${API_URL}/songs/liked?user_id=${firebaseUser.uid}`);
          const json = await res.json();
          if (json.status === "success") {
            setLikedSongsList(json.data);
            setLikedSongIds(new Set(json.data.map(s => s.track_id)));
          }
        } catch (err) {
          console.warn("Failed to fetch liked list on auth change:", err);
        }
      } else {
        setUser(null);
        setLikedSongsList([]);
        setLikedSongIds(new Set());
        localStorage.removeItem('viotune_user');
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // ── Đăng Ký (Sign Up) ─────────────────────────────────────────────────────────
  const signUp = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Cập nhật display name trong Firebase Auth profile
    await updateProfile(firebaseUser, { displayName });
    
    const newUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName
    };
    
    // Đồng bộ thông tin người dùng sang Firestore backend để kích hoạt test user và lưu trữ
    try {
      await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName })
      });
    } catch (backendErr) {
      console.warn("Failed to synchronize user to backend users collection:", backendErr);
    }
    
    setUser(newUser);
    localStorage.setItem('viotune_user', JSON.stringify(newUser));
    setLikedSongsList([]);
    setLikedSongIds(new Set());
    return newUser;
  };

  // ── Đăng Nhập (Sign In) ───────────────────────────────────────────────────────
  const signIn = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    const loggedUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || 'VioTune User'
    };
    
    setUser(loggedUser);
    localStorage.setItem('viotune_user', JSON.stringify(loggedUser));
    
    // Tải danh sách yêu thích
    try {
      const likedRes = await fetch(`${API_URL}/songs/liked?user_id=${firebaseUser.uid}`);
      const likedJson = await likedRes.json();
      if (likedJson.status === "success") {
        setLikedSongsList(likedJson.data);
        setLikedSongIds(new Set(likedJson.data.map(s => s.track_id)));
      }
    } catch (likedErr) {
      console.warn("Failed to fetch liked list after login:", likedErr);
    }
    
    return loggedUser;
  };

  // ── Đăng Nhập Bằng Google ───────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    
    const loggedUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || 'Google User'
    };
    
    // Đồng bộ thông tin sang FastAPI Firestore backend
    try {
      await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: firebaseUser.email, 
          password: 'social-auth-placeholder-password',
          displayName: loggedUser.displayName 
        })
      });
    } catch (backendErr) {
      console.warn("Failed to synchronize Google user to backend:", backendErr);
    }
    
    setUser(loggedUser);
    localStorage.setItem('viotune_user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  // ── Đăng Nhập Bằng Facebook ───────────────────────────────────────────────────
  const signInWithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    
    const loggedUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || 'facebook-user@viotune.com',
      displayName: firebaseUser.displayName || 'Facebook User'
    };
    
    // Đồng bộ thông tin sang FastAPI Firestore backend
    try {
      await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: loggedUser.email, 
          password: 'social-auth-placeholder-password',
          displayName: loggedUser.displayName 
        })
      });
    } catch (backendErr) {
      console.warn("Failed to synchronize Facebook user to backend:", backendErr);
    }
    
    setUser(loggedUser);
    localStorage.setItem('viotune_user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  // ── Đăng Xuất (Sign Out) ─────────────────────────────────────────────────────
  const logOut = async () => {
    await signOut(auth);
    localStorage.removeItem('viotune_user');
    setUser(null);
    setLikedSongsList([]);
    setLikedSongIds(new Set());
  };

  // ── Thích Bài Hát (Like Song) ─────────────────────────────────────────────────
  const likeSong = async (track) => {
    if (!user) return;
    
    // Optimistic Update
    const newTrack = {
      track_id: track.track_id,
      track_name: track.track_name,
      artists: track.artists,
      track_genre: track.track_genre || '',
      likedAt: new Date().toISOString()
    };
    
    setLikedSongsList(prev => [...prev, newTrack]);
    setLikedSongIds(prev => new Set([...prev, track.track_id]));

    try {
      const res = await fetch(`${API_URL}/songs/${track.track_id}/like?user_id=${user.uid}`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.status !== "success") {
        throw new Error(json.message || "Failed to like song.");
      }
    } catch (err) {
      console.warn("FastAPI like update failed, reverting optimistic state:", err);
      // Revert
      setLikedSongsList(prev => prev.filter(s => s.track_id !== track.track_id));
      setLikedSongIds(prev => {
        const next = new Set(prev);
        next.delete(track.track_id);
        return next;
      });
    }
  };

  // ── Bỏ Thích Bài Hát (Unlike Song) ───────────────────────────────────────────
  const unlikeSong = async (trackId) => {
    if (!user) return;
    
    // Keep reference for reverting on error
    const removedSong = likedSongsList.find(s => s.track_id === trackId);
    
    // Optimistic Update
    setLikedSongsList(prev => prev.filter(s => s.track_id !== trackId));
    setLikedSongIds(prev => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });

    try {
      const res = await fetch(`${API_URL}/songs/${trackId}/like?user_id=${user.uid}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.status !== "success") {
        throw new Error(json.message || "Failed to unlike song.");
      }
    } catch (err) {
      console.warn("FastAPI unlike update failed, reverting optimistic state:", err);
      if (removedSong) {
        setLikedSongsList(prev => [...prev, removedSong]);
        setLikedSongIds(prev => new Set([...prev, trackId]));
      }
    }
  };

  // ── Lấy Danh Sách Bài Hát Yêu Thích ──────────────────────────────────────────
  const getLikedSongs = async () => {
    if (!user) return [];
    try {
      const res = await fetch(`${API_URL}/songs/liked?user_id=${user.uid}`);
      const json = await res.json();
      return json.status === "success" ? json.data : [];
    } catch (err) {
      console.warn("Failed to fetch liked list:", err);
      return [];
    }
  };

  // ── Ghi nhận lịch sử nghe (Record Song Play) ─────────────────────────────────
  const recordPlay = async (track) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/songs/${track.track_id}/play?user_id=${user.uid}`, {
        method: 'POST'
      });
    } catch (err) {
      console.warn("Failed to record play history on backend:", err);
    }
  };

  // ── Lấy Lịch Sử Phát Nhạc ────────────────────────────────────────────────────
  const getPlayHistory = async () => {
    if (!user) return [];
    try {
      const res = await fetch(`${API_URL}/songs/history?user_id=${user.uid}`);
      const json = await res.json();
      return json.status === "success" ? json.data : [];
    } catch (err) {
      console.warn("Failed to fetch play history:", err);
      return [];
    }
  };
  
  // ── Đặt Lại Mật Khẩu (Reset Password) ────────────────────────────────────────
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
    return "Password reset email sent successfully via Firebase.";
  };

  const value = {
    user,
    loading,
    likedSongsList,
    likedSongIds,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    logOut,
    likeSong,
    unlikeSong,
    getLikedSongs,
    recordPlay,
    getPlayHistory,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
