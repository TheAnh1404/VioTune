import React from 'react';
import styles from './HeroSeries.module.css';
import { Heart } from 'lucide-react';

const SeriesCard = ({ title, tracks, imageUrl }) => (
  <div className={styles.seriesCard}>
    <img src={imageUrl} alt={title} className={styles.seriesImg} />
    <div className={styles.heartIcon}>
      <Heart size={20} />
    </div>
    <div className={styles.overlay}>
      <h4 className={styles.seriesTitle}>{title}</h4>
      <span className={styles.tracks}>{tracks} Tracks</span>
    </div>
  </div>
);

const HeroSeries = () => {
  const seriesData = [
    { id: 1, title: 'Expats', tracks: 109, imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400' },
    { id: 2, title: 'Arcane', tracks: 86, imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400' },
    { id: 3, title: 'Shōgun', tracks: 17, imageUrl: 'https://images.unsplash.com/photo-1528164344705-4754268799af?w=400' },
    { id: 4, title: 'Ozark', tracks: 109, imageUrl: 'https://images.unsplash.com/photo-1500462859194-845728645287?w=400' },
    { id: 5, title: 'Riplay', tracks: 109, imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400' },
  ];

  return (
    <section className={styles.heroContainer}>
      <h1 className={styles.title}>
        Discover The Magic Of Series Musics With Viotune
      </h1>
      
      <button className={styles.joinBtn}>Join Now</button>

      <div className={styles.seriesGrid}>
        {seriesData.map((item) => (
          <SeriesCard 
            key={item.id}
            title={item.title}
            tracks={item.tracks}
            imageUrl={item.imageUrl}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSeries;