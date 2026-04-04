import React from 'react';
import { Music, Clock, User, Heart, Grip } from 'lucide-react';
import styles from './PlaylistPanel.module.css';

const PlaylistPanel = () => {
  const tracks = Array(8).fill({
    title: 'empty note',
    artist: 'ghostly kisses',
    image: 'https://images.unsplash.com/photo-1478147424560-6ddcd5766aa0?auto=format&fit=crop&q=80&w=60&h=60' // placeholder abstraction
  });

  return (
    <div className={styles.panelContainer}>
      <div className={styles.header}>
        <h2>Sorrowfull PostRock</h2>
        <Grip className={styles.headerIcon} />
      </div>

      <div className={styles.infoSection}>
        <img 
          src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=150&h=150" 
          alt="Album Cover" 
          className={styles.mainCover} 
        />
        <div className={styles.infoDetails}>
          <div className={styles.infoItem}>
            <Music size={18} strokeWidth={2} /> <span>15 Tracks</span>
          </div>
          <div className={styles.infoItem}>
            <Clock size={18} strokeWidth={2} /> <span>01:11:58</span>
          </div>
          <div className={styles.infoItem}>
            <User size={18} strokeWidth={2} /> <span>Rayan</span>
          </div>
        </div>
      </div>

      <div className={styles.trackListWrapper}>
        <div className={styles.trackList}>
          {tracks.map((track, index) => (
            <div key={index} className={styles.trackItem}>
              <img src={track.image} alt="Track" className={styles.trackThumb} />
              <div className={styles.trackInfo}>
                <div className={styles.trackTitle}>{track.title}</div>
                <div className={styles.trackArtist}>{track.artist}</div>
              </div>
              <Heart size={18} strokeWidth={1.5} className={styles.heartIcon} />
              <Grip size={18} strokeWidth={1.5} className={styles.dragIcon} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaylistPanel;
