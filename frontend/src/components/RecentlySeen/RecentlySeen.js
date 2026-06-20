import React from 'react';
import styles from './RecentlySeen.module.css';

const getCoverImage = (trackId, genre) => {
  const images = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
    "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=400",
    "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400"
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

const ItemCard = ({ song, onPlaySong }) => {
  const coverUrl = getCoverImage(song.track_id, song.track_genre);
  return (
    <div className={styles.card} onClick={() => onPlaySong && onPlaySong(song)} style={{ cursor: 'pointer' }}>
      <img src={coverUrl} alt={song.track_name} className={styles.image} />
      <div className={styles.overlay}>
        <h4 className={styles.itemName}>{song.track_name}</h4>
        <span className={styles.itemInfo}>{song.artists}</span>
        <span className={styles.itemInfo} style={{ fontSize: 'var(--text-micro)', color: '#34d399', marginTop: '2px' }}>
          {song.track_genre}
        </span>
      </div>
    </div>
  );
};

const RecentlySeen = ({ recentSongs = [], onPlaySong }) => {
  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>You Recently Listened</h2>
        <span className={styles.seeAll}>See All</span>
      </div>
      
      <div className={styles.grid}>
        {recentSongs.length === 0 ? (
          <div style={{ color: '#64748b', padding: '30px 10px', fontSize: 'var(--text-label)', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', width: '100%' }}>
            No listening history yet. Start playing songs!
          </div>
        ) : (
          recentSongs.map((song) => (
            <ItemCard 
              key={song.track_id} 
              song={song} 
              onPlaySong={onPlaySong} 
            />
          ))
        )}
      </div>
    </section>
  );
};

export default RecentlySeen;