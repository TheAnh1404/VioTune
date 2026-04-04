import React from 'react';
import styles from './PlaylistSection.module.css';
import { Heart } from 'lucide-react';

const PlaylistCard = ({ name, tracks, imageUrl }) => (
  <div className={styles.card}>
    <img src={imageUrl} alt={name} className={styles.image} />
    <div className={styles.heartIcon}>
      <Heart size={20} />
    </div>
    <div className={styles.overlay}>
      <h4 className={styles.playlistName}>{name}</h4>
      <span className={styles.trackCount}>{tracks} Tracks</span>
    </div>
  </div>
);

const PlaylistSection = () => {
  const playlists = [
    { id: 1, name: 'Arcane', tracks: 86, imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400' },
    { id: 2, name: 'Eyes', tracks: 256, imageUrl: 'https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=400' },
    { id: 3, name: 'No Shame', tracks: 98, imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400' },
    { id: 4, name: 'Till Dusk', tracks: 42, imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400' },
    { id: 5, name: 'V.E.T', tracks: 87, imageUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400' },
  ];

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Playlists Tailored For You</h2>
        <span className={styles.seeAll}>See All</span>
      </div>
      
      <div className={styles.grid}>
        {playlists.map((playlist) => (
          <PlaylistCard 
            key={playlist.id} 
            name={playlist.name} 
            tracks={playlist.tracks} 
            imageUrl={playlist.imageUrl} 
          />
        ))}
      </div>
    </section>
  );
};

export default PlaylistSection;