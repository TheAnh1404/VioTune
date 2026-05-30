import React from 'react';
import styles from './InterestGenres.module.css';

const GenreCard = ({ name, imageUrl, onClick }) => (
  <div className={styles.genreCard} onClick={() => onClick && onClick(name)} style={{ cursor: 'pointer' }}>
    <img src={imageUrl} alt={name} className={styles.image} />
    <div className={styles.overlay}>
      <h4 className={styles.genreName}>{name}</h4>
    </div>
  </div>
);

const InterestGenres = ({ onSelectGenre }) => {
  const genres = [
    { id: 1, name: 'Pop', imageUrl: 'https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=400' },
    { id: 2, name: 'Hip-Hop', imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400' },
    { id: 3, name: 'Latin', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400' },
    { id: 4, name: 'Rock', imageUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400' },
    { id: 5, name: 'Jazz', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400' },
    { id: 6, name: 'Classical', imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400' },
  ];

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Genres You Interested In</h2>
        <span className={styles.seeAll}>See All</span>
      </div>

      <div className={styles.grid}>
        {genres.map((genre) => (
          <GenreCard 
            key={genre.id} 
            name={genre.name} 
            imageUrl={genre.imageUrl} 
            onClick={onSelectGenre}
          />
        ))}
      </div>
    </section>
  );
};

export default InterestGenres;