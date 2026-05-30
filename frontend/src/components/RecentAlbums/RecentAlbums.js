import React, { useState, useEffect } from 'react';
import styles from './RecentAlbums.module.css';
import { Heart } from 'lucide-react';

const AlbumCard = ({ title, artist, coverUrl, onClick }) => (
  <div className={styles.card} onClick={onClick} style={{ cursor: 'pointer' }}>
    <div className={styles.albumWrapper}>
      <img src={coverUrl} alt={title} className={styles.cover} />
      <div className={styles.vinylDisc}>
        <div className={styles.vinylCenter} />
      </div>
    </div>
    
    <div className={styles.info}>
      <h4 className={styles.albumName}>{title}</h4>
      <p className={styles.artist}>{artist}</p>
    </div>

    <div className={styles.heartIcon} onClick={(e) => e.stopPropagation()}>
      <Heart size={20} />
    </div>
  </div>
);

const RecentAlbums = ({ onAlbumClick }) => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAlbums = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/albums?limit=6");
        const json = await res.json();
        if (json.status === "success") {
          setAlbums(json.data);
        }
      } catch (err) {
        console.error("Error fetching albums:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Albums You Were Listening To</h2>
        <span className={styles.seeAll}>See All</span>
      </div>

      <div className={styles.grid}>
        {loading ? (
          <p style={{ color: '#a0aec0', padding: '10px' }}>Loading albums...</p>
        ) : albums.length === 0 ? (
          <p style={{ color: '#a0aec0', padding: '10px' }}>No albums available.</p>
        ) : (
          albums.map((album) => (
            <AlbumCard 
              key={album.id}
              title={album.title}
              artist={album.artist}
              coverUrl={album.imageUrl}
              onClick={() => onAlbumClick && onAlbumClick(album.artist)}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default RecentAlbums;