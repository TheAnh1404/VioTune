import React from 'react';
import styles from './RecentAlbums.module.css';
import { Heart } from 'lucide-react';

const AlbumCard = ({ title, artist, coverUrl }) => (
  <div className={styles.card}>
    <div className={styles.albumWrapper}>
      <img src={coverUrl} alt={title} className={styles.cover} />
      <div className={styles.vinylDisc}>
        <div className={styles.vinylCenter} />
      </div>
    </div>
    
    <div className={styles.info}>
      <h4 className={styles.albumName}>{title}</h4>
      <p className={styles.artist}>{artist}</p>
    </div>

    <div className={styles.heartIcon}>
      <Heart size={20} />
    </div>
  </div>
);

const RecentAlbums = () => {
  const albums = [
    { id: 1, title: 'The Torture...', artist: 'Taylor Swift', coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200' },
    { id: 2, title: 'The Torture...', artist: 'Taylor Swift', coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=200' },
    { id: 3, title: 'The Torture...', artist: 'Taylor Swift', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200' },
    { id: 4, title: 'The Torture...', artist: 'Taylor Swift', coverUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673b?w=200' },
    { id: 5, title: 'The Torture...', artist: 'Taylor Swift', coverUrl: 'https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=200' },
    { id: 6, title: 'The Torture...', artist: 'Taylor Swift', coverUrl: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=200' },
  ];

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Albums You Were Listening To</h2>
        <span className={styles.seeAll}>See All</span>
      </div>

      <div className={styles.grid}>
        {albums.map((album) => (
          <AlbumCard 
            key={album.id}
            title={album.title}
            artist={album.artist}
            coverUrl={album.coverUrl}
          />
        ))}
      </div>
    </section>
  );
};

export default RecentAlbums;