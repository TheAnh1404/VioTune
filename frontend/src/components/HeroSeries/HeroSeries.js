import React from 'react';
import styles from './HeroSeries.module.css';
import { Heart } from 'lucide-react';

const SeriesCard = ({ title, tracks, imageUrl, onClick }) => (
  <div className={styles.seriesCard} onClick={onClick} style={{ cursor: 'pointer' }}>
    <img src={imageUrl} alt={title} className={styles.seriesImg} />
    <div className={styles.heartIcon} onClick={(e) => e.stopPropagation()}>
      <Heart size={20} />
    </div>
    <div className={styles.overlay}>
      <h4 className={styles.seriesTitle}>{title}</h4>
      <span className={styles.tracks}>{tracks} Tracks</span>
    </div>
  </div>
);

const HeroSeries = ({ onSelectSeries }) => {
  const seriesData = [
    { id: 1, title: 'Expats', tracks: 120, imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400', genre: 'pop' },
    { id: 2, title: 'Arcane', tracks: 86, imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', genre: 'indie' },
    { id: 3, title: 'Shōgun', tracks: 42, imageUrl: 'https://images.unsplash.com/photo-1528164344705-4754268799af?w=400', genre: 'classical' },
    { id: 4, title: 'Ozark', tracks: 95, imageUrl: 'https://images.unsplash.com/photo-1500462859194-845728645287?w=400', genre: 'acoustic' },
    { id: 5, title: 'Riplay', tracks: 68, imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400', genre: 'jazz' },
  ];

  return (
    <section className={styles.heroContainer}>
      <h1 className={styles.title}>
        Discover The Magic Of Series Musics With Viotune
      </h1>
      
      <button 
        className={styles.joinBtn} 
        onClick={() => onSelectSeries && onSelectSeries('Featured Soundtrack Hits', 'alternative')}
      >
        Explore Featured Tracks
      </button>

      <div className={styles.seriesGrid}>
        {seriesData.map((item) => (
          <SeriesCard 
            key={item.id}
            title={item.title}
            tracks={item.tracks}
            imageUrl={item.imageUrl}
            onClick={() => onSelectSeries && onSelectSeries(`Soundtracks: ${item.title}`, item.genre)}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSeries;