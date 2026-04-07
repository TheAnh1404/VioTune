import React from 'react';
import { Play } from 'lucide-react';
import styles from './MoreArtists.module.css';

const ArtistCard = ({ name, imageUrl }) => (
  <div className={styles.card}>
    <div className={styles.avatarWrapper}>
      <img src={imageUrl} alt={name} className={styles.avatarImg} />
      <div className={styles.playOverlay}>
        <Play className={styles.playIcon} size={20} fill="currentColor" />
      </div>
    </div>
    <span className={styles.artistName}>{name}</span>
  </div>
);

const MoreArtists = () => {
  const suggestedArtists = [
    { id: 1, name: 'NF', imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80' },
    { id: 2, name: 'Ed Sheeran', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
    { id: 3, name: 'Drake', imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&q=80' },
    { id: 4, name: 'Travis Scott', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80' },
    { id: 5, name: 'Billie Eilish', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80' },
  ];

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>More Artists You'll Love</h2>
        <span className={styles.seeAll}>See All</span>
      </div>
      
      <div className={styles.grid}>
        {suggestedArtists.map((artist) => (
          <ArtistCard 
            key={artist.id} 
            name={artist.name} 
            imageUrl={artist.imageUrl} 
          />
        ))}
      </div>
    </section>
  );
};

export default MoreArtists;