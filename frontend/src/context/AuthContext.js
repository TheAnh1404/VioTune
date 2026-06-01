// ─── Tái Cấu Trúc AuthContext cho VioTune FastAPI Backend ────────────────────────
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

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

  // ── Khôi phục trạng thái đăng nhập từ localStorage khi mount ──────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const saved = localStorage.getItem('viotune_user');
      if (saved) {
        try {
          const parsedUser = JSON.parse(saved);
          setUser(parsedUser);
          
          // Lấy danh sách bài hát yêu thích từ SQLite backend
          const res = await fetch(`${API_URL}/songs/liked?user_id=${parsedUser.uid}`);
          const json = await res.json();
          if (json.status === "success") {
            setLikedSongsList(json.data);
            setLikedSongIds(new Set(json.data.map(s => s.track_id)));
          }
        } catch (err) {
          console.warn("Failed to restore local session:", err);
          localStorage.removeItem('viotune_user');
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  // ── Đăng Ký (Sign Up) ─────────────────────────────────────────────────────────
  const signUp = async (email, password, displayName) => {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    });
    
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.detail || 'Failed to sign up.');
    }
    
    const newUser = json.user;
    localStorage.setItem('viotune_user', JSON.stringify(newUser));
    setUser(newUser);
    setLikedSongsList([]);
    setLikedSongIds(new Set());
    return newUser;
  };

  // ── Đăng Nhập (Sign In) ───────────────────────────────────────────────────────
  const signIn = async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const json = await response.json();
    if (!response.ok) {
      // Create Firebase-like auth error structure for perfect backward compatibility
      const err = new Error(json.detail || 'Login failed.');
      err.code = json.detail === 'No account found with this email.' 
        ? 'auth/user-not-found' 
        : (json.detail === 'Incorrect password.' ? 'auth/wrong-password' : 'auth/invalid-credential');
      throw err;
    }
    
    const loggedUser = json.user;
    localStorage.setItem('viotune_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    
    // Tải danh sách yêu thích
    try {
      const likedRes = await fetch(`${API_URL}/songs/liked?user_id=${loggedUser.uid}`);
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

  // ── Đăng Xuất (Sign Out) ─────────────────────────────────────────────────────
  const logOut = async () => {
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
        method: 'POST'
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
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const json = await response.json();
    if (!response.ok) {
      const err = new Error(json.detail || 'Reset password failed.');
      err.code = 'auth/user-not-found';
      throw err;
    }
    return json.message;
  };

  const value = {
    user,
    loading,
    likedSongsList,
    likedSongIds,
    signUp,
    signIn,
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
