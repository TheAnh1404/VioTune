import React from 'react';
import styles from './MusicPlayer.module.css';
import { 
  SkipBack, SkipForward, Pause, Play, 
  Repeat1, ListMusic, Volume2 
} from 'lucide-react';

const MusicPlayer = () => {
  return (
    <div className={styles.playerWrapper}>
      {/* Cột trái: Thông tin bài hát */}
      <div className={styles.songInfo}>
        <img 
          src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100" 
          alt="Album Art" 
          className={styles.albumArt} 
        />
        <div className={styles.textGroup}>
          <h4 className={styles.title}>Ma Meilleure Ennemie</h4>
          <span className={styles.artist}>Stromae & Pomme</span>
        </div>
      </div>

      {/* Cột giữa: Điều khiển và Thanh tiến trình */}
      <div className={styles.controlsContainer}>
        <div className={styles.mainButtons}>
          <SkipBack size={24} className={styles.icon} />
          <div className={styles.playPauseBtn}>
            <Pause size={30} fill="currentColor" />
          </div>
          <SkipForward size={24} className={styles.icon} />
        </div>

        <div className={styles.progressWrapper}>
          <span className={styles.time}>01:29</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} />
          </div>
          <span className={styles.time}>02:28</span>
        </div>
      </div>

      {/* Cột phải: Volume và Tiện ích */}
      <div className={styles.utilities}>
        <Repeat1 size={20} className={styles.icon} />
        <ListMusic size={20} className={styles.icon} />
        <div className={styles.volumeGroup}>
          <Volume2 size={20} className={styles.icon} />
          <div className={styles.volumeBar}>
            <div className={styles.volumeFill} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;