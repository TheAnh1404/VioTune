import React, { useState, useEffect } from 'react';
import { Music, User, Heart, Trash2 } from 'lucide-react';
import styles from './PlaylistPanel.module.css';
import { API_URL } from '../../config';

const getCoverImage = (trackId, genre) => {
  const images = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100",
    "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=100",
    "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=100",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100"
  ];
  let hash = 0;
  if (trackId) {
    for (let i = 0; i < trackId.length; i++) {
      hash = trackId.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const index = Math.abs(hash) % images.length;
  return images[index];
};

const PlaylistPanel = ({ userId = 42, onPlaySong, currentSong, isPlaying, refreshTrigger, onUnlikeSong }) => {
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLikedSongs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/songs/liked?user_id=${userId}`);
      const json = await res.json();
      if (json.status === "success") {
        setLikedSongs(json.data);
      }
    } catch (err) {
      console.error("Error fetching liked songs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedSongs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshTrigger]);

  const handleUnlike = async (e, trackId) => {
    e.stopPropagation(); // Avoid playing the song
    try {
      const res = await fetch(`${API_URL}/songs/${trackId}/like?user_id=${userId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.status === "success") {
        fetchLikedSongs(); // Refresh
        if (onUnlikeSong) onUnlikeSong(trackId);
      }
    } catch (err) {
      console.error("Error unliking song:", err);
    }
  };

  return (
    <div className={styles.panelContainer}>
      <div className={styles.header}>
        <h2>Your Favorite Tracks</h2>
      </div>

      <div className={styles.infoSection}>
        <img 
          src="https://images.unsplash.com/photo-1513829096970-c9703c73c3ee?auto=format&fit=crop&q=80&w=150&h=150" 
          alt="Album Cover" 
          className={styles.mainCover} 
        />
        <div className={styles.infoDetails}>
          <div className={styles.infoItem}>
            <Music size={18} strokeWidth={2} /> <span>{likedSongs.length} Songs</span>
          </div>
          <div className={styles.infoItem}>
            <Heart size={18} strokeWidth={2} style={{ color: '#ef4444' }} fill="#ef4444" /> <span>Liked by You</span>
          </div>
          <div className={styles.infoItem}>
            <User size={18} strokeWidth={2} /> <span>User {userId}</span>
          </div>
        </div>
      </div>

      <div className={styles.trackListWrapper}>
        <div className={styles.trackList}>
          {loading ? (
            <p style={{ color: '#a0aec0', padding: '20px', fontSize: '14px', textAlign: 'center' }}>Loading favorites...</p>
          ) : likedSongs.length === 0 ? (
            <div style={{ color: '#64748b', padding: '40px 10px', fontSize: '13px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              No favorite songs yet.<br />Click the Heart icon on any song to add it!
            </div>
          ) : (
            likedSongs.map((track, index) => {
              const isCurrent = currentSong && currentSong.track_id === track.track_id;
              const cover = getCoverImage(track.track_id, track.track_genre);
              return (
                <div 
                  key={track.track_id} 
                  className={`${styles.trackItem} ${isCurrent ? styles.activeTrack : ''}`}
                  onClick={() => onPlaySong && onPlaySong(track, likedSongs)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={cover} alt="Track" className={styles.trackThumb} />
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: isCurrent ? '#1db954' : '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{track.track_name}</div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#a0aec0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{track.artists}</div>
                  </div>
                  <button 
                    onClick={(e) => handleUnlike(e, track.track_id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: '#ef4444' }}
                    title="Remove from favorites"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistPanel;
