import React from 'react';
import styles from './DailyPick.module.css';
import { Heart, MoreHorizontal, LayoutGrid } from 'lucide-react';

const SongRow = ({ cover, name, artist, album, time }) => (
  <div className={styles.songRow}>
    <img src={cover} alt={name} className={styles.coverImg} />
    
    <div className={styles.mainInfo}>
      <h4 className={styles.songName}>{name}</h4>
      <p className={styles.artistName}>{artist}</p>
    </div>

    <div className={styles.albumInfo}>
      {album}
    </div>

    <div className={styles.duration}>
      {time}
    </div>

    <div className={styles.actions}>
      <Heart size={20} className={styles.actionIcon} />
      <LayoutGrid size={20} className={styles.actionIcon} />
    </div>
  </div>
);

const DailyPick = () => {
  const songs = [
    { id: 1, name: 'Chihiro', artist: 'Billie Eilish', album: 'Hit Me Hard and soft', time: '3:48', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100' },
    { id: 2, name: 'Chihiro', artist: 'Billie Eilish', album: 'Hit Me Hard and soft', time: '3:48', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100' },
    { id: 3, name: 'Chihiro', artist: 'Billie Eilish', album: 'Hit Me Hard and soft', time: '3:48', cover: 'https://images.unsplash.com/photo-1459749411177-042180ce673b?w=100' },
    { id: 4, name: 'Chihiro', artist: 'Billie Eilish', album: 'Hit Me Hard and soft', time: '3:48', cover: 'https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=100' },
    { id: 5, name: 'Chihiro', artist: 'Billie Eilish', album: 'Hit Me Hard and soft', time: '3:48', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100' },
  ];

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Daily Pick</h2>
        <span className={styles.seeAll}>See All</span>
      </div>

      <div className={styles.list}>
        {songs.map(song => (
          <SongRow key={song.id} {...song} />
        ))}
      </div>
    </section>
  );
};

export default DailyPick;