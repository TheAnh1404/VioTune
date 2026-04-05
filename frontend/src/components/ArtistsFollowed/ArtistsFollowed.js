import React from 'react';
import styles from './ArtistsFollowed.module.css';

const ArtistCard = ({ name, imageUrl }) => (
  <div className={styles.card}>
    <div className={styles.avatarWrapper}>
      <img src={imageUrl} alt={name} className={styles.avatarImg} />
    </div>
    <span className={styles.artistName}>{name}</span>
  </div>
);

const ArtistsFollowed = () => {
  const artists = [
    { id: 1, name: 'NF', imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200' },
    { id: 2, name: 'ed sheeran', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
    { id: 3, name: 'drake', imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200' },
    { id: 4, name: 'Travis scott', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200' },
    { id: 5, name: 'Billie eilish', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
  ];

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Artists You Follow</h2>
        <span className={styles.seeAll}>See All</span>
      </div>
      
      <div className={styles.grid}>
        {artists.map((artist) => (
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

export default ArtistsFollowed;