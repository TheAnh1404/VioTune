import React from 'react';
import styles from './TrendingNow.module.css';
import { Heart, Play, Pause } from 'lucide-react';

const getCoverImage = (trackId, genre) => {
  const images = [
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300",
    "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=300",
    "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=300",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
    "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
    "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=300",
    "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300"
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
          <Pause size={22} className={styles.actionIcon} fill="currentColor" style={{ color: '#1db954' }} />
        ) : (
          <Play size={22} className={styles.actionIcon} />
        )}
        <Heart 
          size={22} 
          className={styles.actionIcon} 
          onClick={(e) => { e.stopPropagation(); onLikeSong && onLikeSong(song); }}
          style={isLiked ? { color: '#ef4444' } : {}}
          fill={isLiked ? '#ef4444' : 'none'}
        />
      </div>
    </div>
  );
};

const TrendingNow = ({ songs = [], title = "Trending Now", onPlaySong, currentSong, likedSongIds = new Set(), onLikeSong, isLoading = false }) => {
  return (
    <section className={styles.sectionContainer} id="trending-now-section">
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {songs.length > 0 && !isLoading && <span className={styles.seeAll}>See All ({songs.length})</span>}
      </div>

      <div className={styles.listContainer}>
        {isLoading ? (
          <p style={{ color: '#1db954', padding: '30px', textAlign: 'center', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-body-sm)' }}>
            🔍 Searching tracks in database...
          </p>
        ) : songs.length === 0 ? (
          <p style={{ color: '#a0aec0', padding: '20px', textAlign: 'center' }}>No songs found.</p>
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

export default TrendingNow;