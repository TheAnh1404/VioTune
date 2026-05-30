import React, { useState } from 'react';
import styles from './MusicPlayer.module.css';
import { 
  SkipBack, SkipForward, Pause, Play, 
  Repeat, Shuffle, ListMusic, Volume2, VolumeX 
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

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const MusicPlayer = ({ 
  currentSong, 
  isPlaying, 
  onTogglePlay,
  duration = 0,
  currentTime = 0,
  onSeek,
  onNext,
  onPrev,
  repeatMode = 'off',
  isShuffle = false,
  onToggleRepeat,
  onToggleShuffle,
  onToggleQueue,
  showQueue = false,
  volume = 0.8,
  onVolumeChange
}) => {
  const songTitle = currentSong ? currentSong.track_name : "No song playing";
  const songArtist = currentSong ? currentSong.artists : "Select a song to start listening";
  const songGenre = currentSong ? currentSong.track_genre : "";
  const coverUrl = currentSong 
    ? getCoverImage(currentSong.track_id, currentSong.track_genre)
    : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100";

  const [prevVolume, setPrevVolume] = useState(0.8);

  const handleMuteToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      if (onVolumeChange) onVolumeChange(0);
    } else {
      if (onVolumeChange) onVolumeChange(prevVolume > 0 ? prevVolume : 0.8);
    }
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickRatio = clickX / width;
    if (onSeek && duration > 0) {
      onSeek(clickRatio * duration);
    }
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickRatio = Math.max(0, Math.min(1, clickX / width));
    if (onVolumeChange) {
      onVolumeChange(clickRatio);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

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
          <h4 className={styles.title} title={songTitle}>{songTitle}</h4>
          <span className={styles.artist} title={songArtist}>
            {songArtist} {songGenre && `• ${songGenre}`}
          </span>
        </div>
      </div>

      {/* Cột giữa: Điều khiển và Thanh tiến trình */}
      <div className={styles.controlsContainer}>
        <div className={styles.mainButtons}>
          <Shuffle 
            size={20} 
            className={`${styles.icon} ${isShuffle ? styles.activeIcon : ''}`} 
            onClick={onToggleShuffle}
            title={isShuffle ? "Shuffle On" : "Shuffle Off"}
          />
          <SkipBack size={24} className={styles.icon} onClick={onPrev} title="Previous Song" />
          <div className={styles.playPauseBtn} onClick={onTogglePlay} style={{ cursor: 'pointer' }}>
            {isPlaying && currentSong ? (
              <Pause size={30} fill="currentColor" />
            ) : (
              <Play size={30} fill="currentColor" style={{ marginLeft: '4px' }} />
            )}
          </div>
          <SkipForward size={24} className={styles.icon} onClick={onNext} title="Next Song" />
          <Repeat 
            size={20} 
            className={`${styles.icon} ${repeatMode !== 'off' ? styles.activeIcon : ''}`} 
            onClick={onToggleRepeat}
            title={`Repeat Mode: ${repeatMode.toUpperCase()}`}
          />
        </div>

        <div className={styles.progressWrapper}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <div className={styles.progressBar} onClick={handleProgressClick}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progressPercent}%`, transition: 'none' }} 
            />
          </div>
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Cột phải: Volume và Tiện ích */}
      <div className={styles.utilities}>
        <ListMusic 
          size={20} 
          className={`${styles.icon} ${showQueue ? styles.activeIcon : ''}`} 
          onClick={onToggleQueue}
          title="Play Queue"
        />
        <div className={styles.volumeGroup}>
          {volume === 0 ? (
            <VolumeX size={20} className={styles.icon} onClick={handleMuteToggle} title="Unmute" />
          ) : (
            <Volume2 size={20} className={styles.icon} onClick={handleMuteToggle} title="Mute" />
          )}
          <div className={styles.volumeBar} onClick={handleVolumeClick}>
            <div className={styles.volumeFill} style={{ width: `${volume * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;