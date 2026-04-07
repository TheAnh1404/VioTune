import React from 'react';
import styles from './RecentlySeen.module.css';
import { Heart } from 'lucide-react';

const ItemCard = ({ name, info, imageUrl }) => (
  <div className={styles.card}>
    <img src={imageUrl} alt={name} className={styles.image} />
    <div className={styles.heartIcon}>
      <Heart size={20} />
    </div>
    <div className={styles.overlay}>
      <h4 className={styles.itemName}>{name}</h4>
      <span className={styles.itemInfo}>{info}</span>
    </div>
  </div>
);

const RecentlySeen = () => {
  const recentData = [
    { id: 1, name: 'Arcane', info: '86 Tracks', imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400' },
    { id: 2, name: 'Eyes', info: '256 Tracks', imageUrl: 'https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=400' },
    { id: 3, name: 'No Shame', info: '98 Tracks', imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400' },
    { id: 4, name: 'Till Dusk', info: '42 Tracks', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400' },
    { id: 5, name: 'V.E.T', info: '87 Tracks', imageUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400' },
  ];

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>You Recently Seen</h2>
        <span className={styles.seeAll}>See All</span>
      </div>
      
      <div className={styles.grid}>
        {recentData.map((item) => (
          <ItemCard 
            key={item.id} 
            name={item.name} 
            info={item.info} 
            imageUrl={item.imageUrl} 
          />
        ))}
      </div>
    </section>
  );
};

export default RecentlySeen;