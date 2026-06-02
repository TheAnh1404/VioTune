import React, { useState, useEffect } from 'react';
import styles from './DailyPick.module.css';
import { Heart, Play, Pause } from 'lucide-react';
import { API_URL } from '../../config';

const getCoverImage = (trackId, genre) => {
  const images = [
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100",
    "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=100",
    "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=100",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100"
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

const SongRow = ({ song, onPlaySong, isCurrent, isLiked, onLikeSong }) => {
  const cover = getCoverImage(song.track_id, song.track_genre);
  return (
    <div 
      className={`${styles.songRow} ${isCurrent ? styles.activeRow : ''}`} 
      onClick={() => onPlaySong && onPlaySong(song)}
    >
      <img src={cover} alt={song.track_name} className={styles.coverImg} />
      
      <div className={styles.mainInfo}>
        <h4 className={styles.songName}>{song.track_name}</h4>
        <p className={styles.artistName}>{song.artists}</p>
      </div>

      <div className={styles.albumInfo}>
        {song.track_genre}
      </div>

      <div className={styles.duration}>
        Popularity: {song.popularity || 50}
      </div>

      <div className={styles.actions}>
        {isCurrent ? (
          <Pause size={20} className={styles.actionIcon} fill="currentColor" style={{ color: '#1db954' }} />
        ) : (
          <Play size={20} className={styles.actionIcon} />
        )}
        <Heart 
          size={20} 
          className={styles.actionIcon} 
          onClick={(e) => { e.stopPropagation(); onLikeSong && onLikeSong(song); }}
          style={isLiked ? { color: '#ef4444' } : {}}
          fill={isLiked ? '#ef4444' : 'none'}
        />
      </div>
    </div>
  );
};

const DailyPick = ({ onPlaySong, currentSong, likedSongIds = new Set(), onLikeSong }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDailyPicks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/songs/dailypick?limit=5`);
        const json = await res.json();
        if (json.status === "success") {
          setSongs(json.data);
        }
      } catch (err) {
        console.error("Error fetching daily picks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyPicks();
  }, []);

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Daily Pick</h2>
        <span className={styles.seeAll}>See All</span>
      </div>

      <div className={styles.list}>
        {loading ? (
          <p style={{ color: '#a0aec0', padding: '20px' }}>Loading daily picks...</p>
        ) : songs.length === 0 ? (
          <p style={{ color: '#a0aec0', padding: '20px' }}>No daily picks available.</p>
        ) : (
          songs.map(song => (
            <SongRow 
              key={song.track_id} 
              song={song} 
              onPlaySong={(s) => onPlaySong && onPlaySong(s, songs)}
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

export default DailyPick;