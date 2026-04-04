import React from 'react';
import styles from './FeatureCards.module.css';

// Import ảnh của bạn từ thư mục assets
// import recentImg from '../../assets/recent.png';
// import mostImg from '../../assets/most.png';
// import likedImg from '../../assets/liked.png';

const Card = ({ title, imageUrl }) => (
  <div className={styles.card}>
    <img src={imageUrl} alt={title} className={styles.image} />
    <div className={styles.overlay}>
      <h3 className={styles.title}>{title}</h3>
    </div>
  </div>
);

const FeatureCards = () => {
  const features = [
    {
      id: 1,
      title: 'Recently Listened',
      imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500' // Thay bằng ảnh Arcane của bạn
    },
    {
      id: 2,
      title: 'Most Listened',
      imageUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=500' // Thay bằng ảnh chân dung của bạn
    },
    {
      id: 3,
      title: 'Liked Tracks',
      imageUrl: 'https://images.unsplash.com/photo-1514525253361-b83f859b73c0?q=80&w=500' // Thay bằng ảnh bàn tay của bạn
    }
  ];

  return (
    <div className={styles.container}>
      {features.map((item) => (
        <Card key={item.id} title={item.title} imageUrl={item.imageUrl} />
      ))}
    </div>
  );
};

export default FeatureCards;