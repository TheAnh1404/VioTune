import React from 'react';
import { X, Volume2, Trash2 } from 'lucide-react';
import styles from './QueuePanel.module.css';

const getCoverImage = (trackId, genre) => {
  const images = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100",
    "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=100",
    "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=100",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100"
  ];
  let hash = 0;
  if (trackId) {
    for (let i = 0; i < trackId.length; i++) {
      hash = trackId.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const index = Math.abs(hash) % images.length;
  return images[index];
};

const QueuePanel = ({ queue = [], currentIndex = -1, currentSong, onPlaySong, onClearQueue, onClose }) => {
  return (
    <div className={styles.panelContainer}>
      <div className={styles.header}>
        <h2>Play Queue</h2>
        <div className={styles.headerActions}>
          {queue.length > 0 && (
            <button 
              className={styles.clearBtn} 
              onClick={onClearQueue} 
              title="Clear Queue"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose} title="Back to Favorites">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className={styles.infoSection}>
        <img 
          src={currentSong 
            ? getCoverImage(currentSong.track_id, currentSong.track_genre) 
            : "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=150"
          } 
          alt="Queue Cover" 
          className={styles.mainCover} 
        />
        <div className={styles.infoDetails}>
          <div className={styles.infoItem}>
            <span>{queue.length} Tracks in Queue</span>
          </div>
          {currentSong && (
            <div className={styles.nowPlayingIndicator}>
              <Volume2 size={16} style={{ color: '#1db954' }} />
              <span style={{ color: '#1db954', fontWeight: 'var(--weight-semibold)' }}>Now Playing</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.trackListWrapper}>
        <div className={styles.trackList}>
          {queue.length === 0 ? (
            <div className={styles.emptyState}>
              Queue is empty.<br />Start playing songs to populate your queue!
            </div>
          ) : (
            queue.map((track, index) => {
              const isCurrent = currentSong && currentSong.track_id === track.track_id;
              const cover = getCoverImage(track.track_id, track.track_genre);
              return (
                <div 
                  key={`${track.track_id}-${index}`} 
                  className={`${styles.trackItem} ${isCurrent ? styles.activeTrack : ''}`}
                  onClick={() => onPlaySong && onPlaySong(track, queue)}
                >
                  <span className={styles.indexNumber}>
                    {isCurrent ? <Volume2 size={14} style={{ color: '#1db954' }} /> : index + 1}
                  </span>
                  <img src={cover} alt="Track" className={styles.trackThumb} />
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
                    <div className={styles.trackTitle} style={{ color: isCurrent ? '#1db954' : '#fff' }}>
                      {track.track_name}
                    </div>
                    <div className={styles.trackArtist}>{track.artists}</div>
                  </div>
                  {isCurrent && (
                    <div className={styles.playingBadge}>
                      <span className={styles.bar1}></span>
                      <span className={styles.bar2}></span>
                      <span className={styles.bar3}></span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default QueuePanel;
