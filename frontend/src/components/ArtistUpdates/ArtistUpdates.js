import React, { useState, useEffect } from 'react';
import styles from './ArtistUpdates.module.css';
import { Heart } from 'lucide-react';

const getCoverImage = (trackId, genre) => {
  const images = [
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=200",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200",
    "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=200",
    "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=200",
    "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=200"
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

const UpdateCard = ({ song, onPlaySong, isCurrent, isLiked, onLikeSong }) => {
  const cover = getCoverImage(song.track_id, song.track_genre);
  return (
    <div className={styles.card} onClick={() => onPlaySong && onPlaySong(song)} style={{ cursor: 'pointer' }}>
      <div className={styles.imageContainer}>
        <img src={cover} alt={song.track_name} className={styles.albumCover} />
        <div className={styles.vinyl}>
          <div className={styles.vinylInner} />
        </div>
      </div>
      
      <div className={styles.info}>
        <h4 className={styles.songTitle}>{song.track_name}</h4>
        <p className={styles.artistName}>{song.artists}</p>
      </div>

      <div className={styles.heartIcon} onClick={(e) => { e.stopPropagation(); onLikeSong && onLikeSong(song); }} style={isLiked ? { color: '#ef4444' } : {}}>
        <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} />
      </div>
    </div>
  );
};

const ArtistUpdates = ({ onPlaySong, currentSong, likedSongIds = new Set(), onLikeSong }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUpdates = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/songs/random?limit=6");
        const json = await res.json();
        if (json.status === "success") {
          setUpdates(json.data);
        }
      } catch (err) {
        console.error("Error fetching artist updates:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpdates();
  }, []);

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Updates From Followed Artists</h2>
        <span className={styles.seeAll}>See All</span>
      </div>

      <div className={styles.grid}>
        {loading ? (
          <p style={{ color: '#a0aec0', padding: '10px' }}>Checking artist feeds...</p>
        ) : updates.length === 0 ? (
          <p style={{ color: '#a0aec0', padding: '10px' }}>No updates available.</p>
        ) : (
          updates.map((song) => (
            <UpdateCard 
              key={song.track_id}
              song={song}
              onPlaySong={(s) => onPlaySong && onPlaySong(s, updates)}
              isCurrent={currentSong && currentSong.track_id === song.track_id}
              isLiked={likedSongIds.has(song.track_id)}
              onLikeSong={onLikeSong}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default ArtistUpdates;