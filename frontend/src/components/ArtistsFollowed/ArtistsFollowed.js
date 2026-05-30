import React from 'react';
import styles from './ArtistsFollowed.module.css';

const getArtistCover = (name) => {
  const images = [
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
  ];
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const index = Math.abs(hash) % images.length;
  return images[index];
};

const ArtistCard = ({ name, imageUrl, onClick }) => (
  <div className={styles.card} onClick={() => onClick && onClick(name)} style={{ cursor: 'pointer' }}>
    <div className={styles.avatarWrapper}>
      <img src={imageUrl} alt={name} className={styles.avatarImg} />
    </div>
    <span className={styles.artistName}>{name}</span>
  </div>
);

const ArtistsFollowed = ({ artists = [], onArtistClick }) => {
  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Artists You Follow</h2>
        <span className={styles.seeAll}>See All</span>
      </div>
      
      <div className={styles.grid}>
        {artists.length === 0 ? (
          <p style={{ color: '#a0aec0', padding: '10px' }}>Loading artists...</p>
        ) : (
          artists.map((artistName, index) => {
            const cover = getArtistCover(artistName);
            return (
              <ArtistCard 
                key={index} 
                name={artistName} 
                imageUrl={cover} 
                onClick={onArtistClick}
              />
            );
          })
        )}
      </div>
    </section>
  );
};

export default ArtistsFollowed;