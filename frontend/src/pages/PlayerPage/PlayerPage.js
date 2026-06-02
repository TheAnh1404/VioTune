import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';
import Header from '../../components/Header/Header';
import styles from './PlayerPage.module.css';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Heart, Volume2, VolumeX, ListMusic, AlignLeft, Info,
  ChevronLeft, Award, Disc, Sparkles
} from 'lucide-react';
import { API_URL } from '../../config';

const getCoverImage = (trackId) => {
  const images = [
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500",
    "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=500",
    "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=500",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"
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

// Simulated Lyrics for a high-end feel!
const getSimulatedLyrics = (songTitle, artistName) => {
  return [
    { time: 0, text: `🎵 Đang phát: ${songTitle} - ${artistName} 🎵` },
    { time: 3, text: "Giai điệu vang lên trong đêm thanh vắng..." },
    { time: 8, text: "Từng nốt nhạc đưa ta về miền ký ức xa xôi" },
    { time: 13, text: "Nơi ánh trăng chiếu rọi con đường cũ" },
    { time: 18, text: "Và tiếng cười ấm áp của ngày hôm qua vẫn còn đây" },
    { time: 23, text: "Dù thời gian có trôi nhanh như gió thoảng" },
    { time: 27, text: "Tình yêu âm nhạc trong ta vẫn vẹn nguyên" },
    { time: 30, text: "Cảm ơn bạn đã lựa chọn VioTune ❤️" }
  ];
};

const PlayerPage = () => {
  const navigate = useNavigate();
  const { user, logOut, likeSong, unlikeSong, likedSongsList, likedSongIds } = useAuth();
  
  const { 
    currentSong, isPlaying, queue, currentIndex, duration, currentTime,
    volume, setVolume, repeatMode, isShuffle, previewLoading, previewUrl,
    playSong, togglePlay, seek, nextSong, prevSong, toggleRepeat, toggleShuffle,
    setCurrentIndex, setCurrentSong
  } = usePlayback();

  const [activeTab, setActiveTab] = useState('upnext'); // 'upnext' | 'lyrics' | 'info' | 'similar'
  // Uses global hoisted Likes state from AuthContext
  const [prevVolume, setPrevVolume] = useState(0.8);
  const lyricsContainerRef = useRef(null);
  
  const [similarSongs, setSimilarSongs] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Fetch similar songs whenever currentSong changes (Content-Based AI suggestions)
  useEffect(() => {
    const fetchSimilar = async () => {
      if (!currentSong || !currentSong.track_id) return;
      setLoadingSimilar(true);
      try {
        const res = await fetch(`${API_URL}/recommend/content?song_id=${currentSong.track_id}&top_n=8`);
        const json = await res.json();
        if (json.status === "success") {
          const data = json.data.map(song => ({
            ...song,
            cover_url: song.cover_url || getCoverImage(song.track_id)
          }));
          setSimilarSongs(data);
        }
      } catch (err) {
        console.error("Failed to fetch similar songs:", err);
      } finally {
        setLoadingSimilar(false);
      }
    };
    fetchSimilar();
  }, [currentSong]);

  const username = user?.displayName || user?.email?.split('@')[0] || 'Music Lover';
  const songTitle = currentSong ? currentSong.track_name : "Không có bài hát";
  const songArtist = currentSong ? currentSong.artists : "Chọn một bài hát để bắt đầu";
  const coverUrl = currentSong?.cover_url || (currentSong ? getCoverImage(currentSong.track_id) : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500");

  // Lyrics calculation
  const lyrics = currentSong ? getSimulatedLyrics(songTitle, songArtist) : [];
  const currentLyricIndex = lyrics.findIndex((l, index) => {
    const nextL = lyrics[index + 1];
    return currentTime >= l.time && (!nextL || currentTime < nextL.time);
  });

  // Handled by AuthContext lifecycle

  // Autoscroll lyrics
  useEffect(() => {
    if (lyricsContainerRef.current && currentLyricIndex !== -1) {
      const activeEl = lyricsContainerRef.current.children[currentLyricIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLyricIndex]);

  const handleLike = async () => {
    if (!currentSong || !user) return;
    const isLiked = likedSongIds.has(currentSong.track_id);
    if (isLiked) {
      await unlikeSong(currentSong.track_id);
    } else {
      await likeSong(currentSong);
    }
  };

  const handleMuteToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume > 0 ? prevVolume : 0.8);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickRatio = clickX / width;
    if (duration > 0) {
      seek(clickRatio * duration);
    }
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickRatio = Math.max(0, Math.min(1, clickX / width));
    setVolume(clickRatio);
  };

  const handleQueueItemClick = (song, idx) => {
    setCurrentIndex(idx);
    setCurrentSong(song);
  };

  const handleLogOut = async () => {
    try {
      await logOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className={styles.playerPageContainer}>
      {/* Blurred Ambient Glow Background (YouTube Music Ambient Style) */}
      <div 
        className={styles.ambientGlow} 
        style={{ backgroundImage: `url(${coverUrl})` }}
      />
      
      <Header 
        username={username}
        onLogOut={handleLogOut}
        showSearch={false}
      />

      <div className={styles.mainWrapper}>
        {/* Left Side: Disc Art & Primary Controls */}
        <div className={styles.playerMainArea}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={20} /> Quay lại trang trước
          </button>

          <div className={styles.discSection}>
            <div className={`${styles.discArtContainer} ${isPlaying && !previewLoading ? styles.rotating : ''}`}>
              <img src={coverUrl} alt={songTitle} className={styles.discArt} />
              <div className={styles.discCenterDot}></div>
            </div>

            <div className={styles.songMetadata}>
              <div className={styles.titleRow}>
                <h1 className={styles.songTitleText}>{songTitle}</h1>
                <button 
                  className={`${styles.likeBtn} ${likedSongIds.has(currentSong?.track_id) ? styles.liked : ''}`}
                  onClick={handleLike}
                  disabled={!currentSong}
                >
                  <Heart size={26} fill={likedSongIds.has(currentSong?.track_id) ? "#ef4444" : "transparent"} />
                </button>
              </div>
              <p className={styles.songArtistText}>{songArtist}</p>
              {currentSong?.track_genre && (
                <span className={styles.genreBadge}>{currentSong.track_genre}</span>
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className={styles.progressContainer}>
            <div className={styles.progressBar} onClick={handleProgressClick}>
              <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
              <div className={styles.progressSliderDot} style={{ left: `${progressPercent}%` }} />
            </div>
            <div className={styles.timeRow}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Audio Controls */}
          <div className={styles.controlButtons}>
            <button 
              className={`${styles.utilityBtn} ${isShuffle ? styles.activeUtility : ''}`}
              onClick={toggleShuffle}
              title="Trộn bài"
            >
              <Shuffle size={22} />
            </button>
            
            <button className={styles.playbackBtn} onClick={prevSong} disabled={queue.length === 0} title="Bài trước">
              <SkipBack size={28} fill="currentColor" />
            </button>

            <button 
              className={styles.playPauseBigBtn} 
              onClick={togglePlay}
              disabled={previewLoading || !currentSong}
              style={{ cursor: previewLoading ? 'wait' : 'pointer' }}
            >
              {previewLoading ? (
                <span className={styles.spinner}>⟳</span>
              ) : isPlaying ? (
                <Pause size={36} fill="currentColor" />
              ) : (
                <Play size={36} fill="currentColor" style={{ marginLeft: '6px' }} />
              )}
            </button>

            <button className={styles.playbackBtn} onClick={nextSong} disabled={queue.length === 0} title="Bài tiếp theo">
              <SkipForward size={28} fill="currentColor" />
            </button>

            <button 
              className={`${styles.utilityBtn} ${repeatMode !== 'off' ? styles.activeUtility : ''}`}
              onClick={toggleRepeat}
              title={`Chế độ lặp: ${repeatMode}`}
            >
              <Repeat size={22} />
            </button>
          </div>

          {/* Volume control */}
          <div className={styles.volumeController}>
            <button className={styles.volumeIconBtn} onClick={handleMuteToggle}>
              {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className={styles.volumeBar} onClick={handleVolumeClick}>
              <div className={styles.volumeFill} style={{ width: `${volume * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Sidebar (Up Next / Lyrics / Info) */}
        <div className={styles.tabPanelArea}>
          <div className={styles.tabHeader}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'upnext' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('upnext')}
            >
              <ListMusic size={16} /> Chờ phát ({queue.length})
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'similar' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('similar')}
              style={{ color: activeTab === 'similar' ? '#c084fc' : '#94a3b8' }}
            >
              <Sparkles size={16} style={{ color: activeTab === 'similar' ? '#c084fc' : '#94a3b8' }} /> Gợi ý AI
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'lyrics' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('lyrics')}
            >
              <AlignLeft size={16} /> Lời bài hát
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'info' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <Info size={16} /> Thông tin
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'upnext' && (
              <div className={styles.queueWrapper}>
                {queue.length === 0 ? (
                  <div className={styles.emptyQueue}>
                    <Disc size={48} className={styles.emptyIcon} />
                    <p>Hàng chờ trống</p>
                    <span onClick={() => navigate('/home')}>Quay lại chọn nhạc</span>
                  </div>
                ) : (
                  <div className={styles.queueList}>
                    {queue.map((song, idx) => {
                      const isCurrent = currentSong && currentSong.track_id === song.track_id;
                      const isSongPlaying = isCurrent && isPlaying;
                      return (
                        <div 
                          key={song.track_id + '-' + idx} 
                          className={`${styles.queueItem} ${isCurrent ? styles.currentQueueItem : ''}`}
                          onClick={() => handleQueueItemClick(song, idx)}
                        >
                          <span className={styles.queueIndex}>
                            {isSongPlaying ? (
                              <span className={styles.playingWave}>
                                <span></span><span></span><span></span>
                              </span>
                            ) : (
                              idx + 1
                            )}
                          </span>
                          <img src={song.cover_url || getCoverImage(song.track_id)} alt={song.track_name} className={styles.queueThumb} />
                          <div className={styles.queueInfo}>
                            <h4 className={styles.queueTitle}>{song.track_name}</h4>
                            <p className={styles.queueArtist}>{song.artists}</p>
                          </div>
                          {isCurrent && <span className={styles.nowPlayingBadge}>Đang phát</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lyrics' && (
              <div className={styles.lyricsWrapper}>
                {!currentSong ? (
                  <p className={styles.noLyricsText}>Chưa chọn bài hát để hiển thị lời</p>
                ) : (
                  <div className={styles.lyricsScrollList} ref={lyricsContainerRef}>
                    {lyrics.map((line, index) => {
                      const isActive = index === currentLyricIndex;
                      return (
                        <p 
                          key={index} 
                          className={`${styles.lyricLine} ${isActive ? styles.activeLyricLine : ''}`}
                        >
                          {line.text}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'similar' && (
              <div className={styles.similarWrapper}>
                {!currentSong ? (
                  <p className={styles.noInfoText}>Chọn một bài hát để xem gợi ý</p>
                ) : loadingSimilar ? (
                  <div className={styles.similarList}>
                    <div className={styles.similarBanner}>
                      🪄 Đang chạy thuật toán Content-Based KNN để tìm bài hát tương đồng...
                    </div>
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className={styles.skeletonItem}>
                        <div className={styles.skeletonIndex}>
                          <div className={styles.shimmer}></div>
                        </div>
                        <div className={styles.skeletonThumb}>
                          <div className={styles.shimmer}></div>
                        </div>
                        <div className={styles.skeletonInfo}>
                          <div className={styles.skeletonTitle}>
                            <div className={styles.shimmer}></div>
                          </div>
                          <div className={styles.skeletonArtist}>
                            <div className={styles.shimmer}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : similarSongs.length === 0 ? (
                  <p className={styles.noInfoText}>Không tìm thấy bài hát tương đồng</p>
                ) : (
                  <div className={styles.similarList}>
                    <div className={styles.similarBanner}>
                      🪄 Gợi ý bài hát tương đồng dựa trên thuật toán Content-Based (KNN)
                    </div>
                    {similarSongs.map((song, idx) => {
                      const isSongLiked = likedSongIds.has(song.track_id);
                      return (
                        <div 
                          key={song.track_id + '-' + idx} 
                          className={styles.similarItem}
                          onClick={() => {
                            playSong(song, similarSongs);
                          }}
                        >
                          <span className={styles.similarIndex}>{idx + 1}</span>
                          <img src={song.cover_url || getCoverImage(song.track_id)} alt={song.track_name} className={styles.similarThumb} />
                          <div className={styles.similarInfo}>
                            <h4 className={styles.similarTitle}>{song.track_name}</h4>
                            <p className={styles.similarArtist}>{song.artists} • <span style={{ color: '#06b6d4' }}>{song.track_genre}</span></p>
                          </div>
                          <button 
                            className={`${styles.similarLikeBtn} ${isSongLiked ? styles.liked : ''}`}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (isSongLiked) {
                                await unlikeSong(song.track_id);
                              } else {
                                await likeSong(song);
                              }
                            }}
                          >
                            <Heart size={14} fill={isSongLiked ? '#ef4444' : 'none'} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
 
             {activeTab === 'info' && (
              <div className={styles.infoWrapper}>
                {!currentSong ? (
                  <p className={styles.noInfoText}>Không có thông tin bài hát</p>
                ) : (
                  <div className={styles.infoDetails}>
                    <div className={styles.infoRow}>
                      <Award className={styles.infoRowIcon} size={18} />
                      <div>
                        <h5>Bài hát</h5>
                        <p>{currentSong.track_name}</p>
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <Disc className={styles.infoRowIcon} size={18} />
                      <div>
                        <h5>Nghệ sĩ</h5>
                        <p>{currentSong.artists}</p>
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <Info className={styles.infoRowIcon} size={18} />
                      <div>
                        <h5>Thể loại</h5>
                        <p>{currentSong.track_genre || "Không rõ"}</p>
                      </div>
                    </div>
                    <div className={styles.infoCard}>
                      <h4>Trình phát VioTune Premium</h4>
                      <p>Nhạc chất lượng cao được liên kết trực tiếp với dữ liệu đám mây Firestore, proxy Deezer API 30s.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
