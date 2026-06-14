import React, { useState, useEffect } from 'react';
import styles from './PersonalPlaylist.module.css';
import { Heart } from 'lucide-react';
import { API_URL } from '../../config';
import { authenticatedFetch } from '../../api';

const getCoverImage = (trackId, genre) => {
  const images = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
    "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=400",
    "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
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

const PlaylistCard = ({ song, onPlaySong, isLiked, onLikeSong }) => {
  const coverUrl = getCoverImage(song.track_id, song.track_genre);
  return (
    <div className={styles.card} onClick={() => onPlaySong && onPlaySong(song)}>
      <img src={coverUrl} alt={song.track_name} className={styles.image} />
      <div 
        className={styles.heartIcon} 
        onClick={(e) => { e.stopPropagation(); onLikeSong && onLikeSong(song); }}
        style={isLiked ? { color: '#ef4444' } : {}}
      >
        <Heart size={20} fill={isLiked ? '#ef4444' : 'none'} />
      </div>
      <div className={styles.overlay}>
        <h4 className={styles.playlistName}>{song.track_name}</h4>
        <span className={styles.trackCount}>{song.artists}</span>
        <span className={styles.trackCount} style={{ fontSize: 'var(--text-micro)', color: '#7f9cf5', marginTop: '2px' }}>
          {song.track_genre}
        </span>
      </div>
    </div>
  );
};

const PersonalPlaylist = ({ userId = 42, onPlaySong, likedSongIds = new Set(), onLikeSong }) => {
  const [cfRecs, setCfRecs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCfRecs = async () => {
      setLoading(true);
      try {
        const res = await authenticatedFetch(`${API_URL}/recommend/cf?user_id=${userId}&top_n=6`);
        const json = await res.json();
        if (json.status === "success") {
          setCfRecs(json.data);
        }
      } catch (err) {
        console.error("Lỗi fetch CF recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCfRecs();
  }, [userId]);

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Dành Riêng Cho Bạn (Collaborative Filtering)</h2>
        <span className={styles.seeAll}>See All</span>
      </div>
      
      <div className={styles.grid}>
        {loading ? (
          <p style={{ color: '#a0aec0', padding: '20px' }}>Đang tải gợi ý cá nhân hóa...</p>
        ) : cfRecs.length === 0 ? (
          <p style={{ color: '#a0aec0', padding: '20px' }}>Không có gợi ý nào cho User {userId}.</p>
        ) : (
          cfRecs.map((song) => (
            <PlaylistCard 
              key={song.track_id} 
              song={song} 
              onPlaySong={(s) => onPlaySong && onPlaySong(s, cfRecs)}
              isLiked={likedSongIds.has(song.track_id)}
              onLikeSong={onLikeSong}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default PersonalPlaylist;
