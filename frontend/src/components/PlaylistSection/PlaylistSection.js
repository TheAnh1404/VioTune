import React, { useState, useEffect } from 'react';
import styles from './PlaylistSection.module.css';
import { Heart } from 'lucide-react';

const PlaylistCard = ({ name, tracks, imageUrl, onClick }) => (
  <div className={styles.card} onClick={onClick} style={{ cursor: 'pointer' }}>
    <img src={imageUrl} alt={name} className={styles.image} />
    <div className={styles.heartIcon} onClick={(e) => e.stopPropagation()}>
      <Heart size={20} />
    </div>
    <div className={styles.overlay}>
      <h4 className={styles.playlistName}>{name}</h4>
      <span className={styles.trackCount}>{tracks} Tracks</span>
    </div>
  </div>
);

const PlaylistSection = ({ onSelectPlaylist }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/playlists?limit=5");
        const json = await res.json();
        if (json.status === "success") {
          setPlaylists(json.data);
        }
      } catch (err) {
        console.error("Error fetching playlists:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Playlists Curated For You</h2>
        <span className={styles.seeAll}>See All</span>
      </div>
      
      <div className={styles.grid}>
        {loading ? (
          <p style={{ color: '#a0aec0', padding: '10px' }}>Curating playlists...</p>
        ) : playlists.length === 0 ? (
          <p style={{ color: '#a0aec0', padding: '10px' }}>No playlists available.</p>
        ) : (
          playlists.map((playlist) => (
            <PlaylistCard 
              key={playlist.id} 
              name={playlist.name} 
              tracks={playlist.tracks} 
              imageUrl={playlist.imageUrl} 
              onClick={() => onSelectPlaylist && onSelectPlaylist(playlist.name, playlist.genre)}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default PlaylistSection;