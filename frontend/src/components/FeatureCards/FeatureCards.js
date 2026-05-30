import React from 'react';
import styles from './FeatureCards.module.css';

const Card = ({ title, imageUrl, onClick }) => (
  <div className={styles.card} onClick={onClick} style={{ cursor: 'pointer' }}>
    <img src={imageUrl} alt={title} className={styles.image} />
    <div className={styles.overlay}>
      <h3 className={styles.title}>{title}</h3>
    </div>
  </div>
);

const FeatureCards = () => {
  const handleCardClick = (title) => {
    if (title === 'Recently Listened') {
      const el = document.querySelector('h2:nth-of-type(4)') || document.querySelector('section:last-of-type');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (title === 'Liked Tracks') {
      const sidebar = document.querySelector('h2'); // The favorites panel header
      if (sidebar) {
        sidebar.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (title === 'Most Listened') {
      // Focus SVD Section
      const svdSec = document.querySelector('h2');
      if (svdSec) {
        svdSec.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const features = [
    {
      id: 1,
      title: 'Recently Listened',
      imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500'
    },
    {
      id: 2,
      title: 'Most Listened',
      imageUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=500'
    },
    {
      id: 3,
      title: 'Liked Tracks',
      imageUrl: 'https://images.unsplash.com/photo-1514525253361-b83f859b73c0?q=80&w=500'
    }
  ];

  return (
    <div className={styles.container}>
      {features.map((item) => (
        <Card 
          key={item.id} 
          title={item.title} 
          imageUrl={item.imageUrl} 
          onClick={() => handleCardClick(item.title)}
        />
      ))}
    </div>
  );
};

export default FeatureCards;