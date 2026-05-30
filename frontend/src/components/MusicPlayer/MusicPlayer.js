import React from 'react';
import styles from './MusicPlayer.module.css';
import { 
  SkipBack, SkipForward, Pause, Play, 
  Repeat1, ListMusic, Volume2 
} from 'lucide-react';

const getCoverImage = (trackId, genre) => {
  const images = [
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300",
    "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=300",
    "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=300",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
    "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
    "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=300",
    "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300"
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

const MusicPlayer = ({ currentSong, isPlaying, onTogglePlay }) => {
  const songTitle = currentSong ? currentSong.track_name : "No song playing";
  const songArtist = currentSong ? currentSong.artists : "Select a song to start listening";
  const songGenre = currentSong ? currentSong.track_genre : "";
  const coverUrl = currentSong 
    ? getCoverImage(currentSong.track_id, currentSong.track_genre)
    : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100";

  return (
    <div className={styles.playerWrapper}>
      {/* Cột trái: Thông tin bài hát */}
      <div className={styles.songInfo}>
        <img 
          src={coverUrl} 
          alt="Album Art" 
          className={styles.albumArt} 
        />
        <div className={styles.textGroup}>
          <h4 className={styles.title}>{songTitle}</h4>
          <span className={styles.artist}>
            {songArtist} {songGenre && `• ${songGenre}`}
          </span>
        </div>
      </div>

      {/* Cột giữa: Điều khiển và Thanh tiến trình */}
      <div className={styles.controlsContainer}>
        <div className={styles.mainButtons}>
          <SkipBack size={24} className={styles.icon} />
          <div className={styles.playPauseBtn} onClick={onTogglePlay} style={{ cursor: 'pointer' }}>
            {isPlaying && currentSong ? (
              <Pause size={30} fill="currentColor" />
            ) : (
              <Play size={30} fill="currentColor" style={{ marginLeft: '4px' }} />
            )}
          </div>
          <SkipForward size={24} className={styles.icon} />
        </div>

        <div className={styles.progressWrapper}>
          <span className={styles.time}>{isPlaying && currentSong ? "00:42" : "00:00"}</span>
          <div className={styles.progressBar}>
            <div className={`${styles.progressFill} ${isPlaying && currentSong ? styles.playingProgress : ''}`} />
          </div>
          <span className={styles.time}>{currentSong ? "03:45" : "00:00"}</span>
        </div>
      </div>

      {/* Cột phải: Volume và Tiện ích */}
      <div className={styles.utilities}>
        <Repeat1 size={20} className={styles.icon} />
        <ListMusic size={20} className={styles.icon} />
        <div className={styles.volumeGroup}>
          <Volume2 size={20} className={styles.icon} />
          <div className={styles.volumeBar}>
            <div className={styles.volumeFill} style={{ width: '80%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;