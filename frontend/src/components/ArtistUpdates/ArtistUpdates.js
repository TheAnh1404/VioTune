import React from 'react';
import styles from './ArtistUpdates.module.css';
import { Heart } from 'lucide-react';

const UpdateCard = ({ song, artist, coverImg }) => (
  <div className={styles.card}>
    <div className={styles.imageContainer}>
      <img src={coverImg} alt={song} className={styles.albumCover} />
      <div className={styles.vinyl}>
        <div className={styles.vinylInner} />
      </div>
    </div>
    
    <div className={styles.info}>
      <h4 className={styles.songTitle}>{song}</h4>
      <p className={styles.artistName}>{artist}</p>
    </div>

    <div className={styles.heartIcon}>
      <Heart size={18} />
    </div>
  </div>
);

const ArtistUpdates = () => {
  const updates = [
    { id: 1, song: 'The Torture...', artist: 'Taylor Swift', coverImg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200' },
    { id: 2, song: 'The Torture...', artist: 'Taylor Swift', coverImg: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=200' },
    { id: 3, song: 'The Torture...', artist: 'Taylor Swift', coverImg: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200' },
    { id: 4, song: 'The Torture...', artist: 'Taylor Swift', coverImg: 'https://images.unsplash.com/photo-1459749411177-042180ce673b?w=200' },
    { id: 5, song: 'The Torture...', artist: 'Taylor Swift', coverImg: 'https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=200' },
    { id: 6, song: 'The Torture...', artist: 'Taylor Swift', coverImg: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=200' },
  ];

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Updates From Followed Artists</h2>
        <span className={styles.seeAll}>See All</span>
      </div>

      <div className={styles.grid}>
        {updates.map((item) => (
          <UpdateCard 
            key={item.id}
            song={item.song}
            artist={item.artist}
            coverImg={item.coverImg}
          />
        ))}
      </div>
    </section>
  );
};

export default ArtistUpdates;