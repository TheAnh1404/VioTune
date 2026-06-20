import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';
import Header from '../../components/Header/Header';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
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

// Enhanced Simulated Lyrics Generator for a premium feel
const getSimulatedLyrics = (songTitle, artistName) => {
  return [
    { time: 0, text: `🎵 Bắt đầu nghe: ${songTitle}` },
    { time: 2, text: `Sáng tác bởi: ${artistName}` },
    { time: 5, text: "Giai điệu này thật tuyệt vời, phải không?" },
    { time: 10, text: "VioTune đang phân tích gu âm nhạc của bạn..." },
    { time: 15, text: "Từng nốt nhạc, từng nhịp điệu đều được tối ưu." },
    { time: 20, text: "Bạn có biết? Ca khúc này đang thịnh hành trên toàn cầu." },
    { time: 25, text: "Hãy nhắm mắt lại và tận hưởng không gian này." },
    { time: 30, text: "Nhịp điệu đang dần trở nên sôi động hơn..." },
    { time: 35, text: "Lời nhạc chạy mượt mà theo từng giây phút." },
    { time: 40, text: "Bạn có thể nhấn vào bất kỳ dòng nào để tua nhanh." },
    { time: 45, text: "Đội ngũ kỹ sư VioTune chúc bạn nghe nhạc vui vẻ." },
    { time: 50, text: "Khám phá thêm nhiều bài hát gợi ý AI ở tab bên cạnh." },
    { time: 55, text: "Cảm ơn bạn đã luôn ủng hộ đội ngũ VioTune ❤️" }
  ];
};

const PlayerPage = () => {
  const navigate = useNavigate();
  const { user, logOut, likeSong, unlikeSong, likedSongsList, likedSongIds } = useAuth();
  const userId = user?.uid || 'anonymous';
  
  const { 
    currentSong, isPlaying, queue, duration, currentTime,
    volume, setVolume, repeatMode, isShuffle, previewLoading,
    playSong, togglePlay, seek, nextSong, prevSong, toggleRepeat, toggleShuffle,
    setCurrentIndex, setCurrentSong
  } = usePlayback();

  const [activeTab, setActiveTab] = useState('upnext'); // 'upnext' | 'similar' | 'lyrics' | 'info'
  const [prevVolume, setPrevVolume] = useState(0.8);
  const lyricsContainerRef = useRef(null);
  
  const [similarSongs, setSimilarSongs] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Fetch similar songs whenever currentSong changes (Content-Based AI KNN suggestions)
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
  const songArtist = currentSong ? currentSong.artists : "Vui lòng chọn bài hát";
  const coverUrl = currentSong?.cover_url || (currentSong ? getCoverImage(currentSong.track_id) : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500");

  // Lyrics autoscrolling calculations
  const lyrics = currentSong ? getSimulatedLyrics(songTitle, songArtist) : [];
  const currentLyricIndex = lyrics.findIndex((l, index) => {
    const nextL = lyrics[index + 1];
    return currentTime >= l.time && (!nextL || currentTime < nextL.time);
  });

  // Autoscroll lyrics container - Enhanced centering logic
  useEffect(() => {
    if (lyricsContainerRef.current && currentLyricIndex !== -1 && activeTab === 'lyrics') {
      const activeEl = lyricsContainerRef.current.children[currentLyricIndex];
      if (activeEl) {
        // Calculate dynamic offset to center the line
        const container = lyricsContainerRef.current;
        const offsetTop = activeEl.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
        
        container.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }
  }, [currentLyricIndex, activeTab]);

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

  const handleLyricClick = (time) => {
    seek(time);
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
      
      {/* Blurred Ambient Glow Background */}
      <div 
        className={styles.ambientGlow} 
        style={{ backgroundImage: `url(${coverUrl})` }}
      />
      
      <Header 
        username={username}
        onLogOut={handleLogOut}
        showSearch={false}
      />

      <div className={styles.contentWrapper}>
        <SideBarMenu 
          userId={userId}
          likedSongs={likedSongsList}
          likedSongIds={likedSongIds}
          onPlaySong={(song) => {
            playSong(song, likedSongsList);
          }}
          currentSong={currentSong}
        />
        <div className={styles.mainContent}>
          <div className={styles.mainWrapper}>
        
        {/* LEFT COLUMN: Spinning disc art & timeline controller */}
        <div className={styles.playerMainArea}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={16} /> Quay lại trang cũ
          </button>

          <div className={styles.discSection}>
            <div className={`${styles.discArtContainer} ${isPlaying && !previewLoading ? styles.rotating : ''}`}>
              <img src={coverUrl} alt={songTitle} className={styles.discArt} />
              <div className={styles.discCenterDot}></div>
            </div>

            <div className={styles.songMetadata}>
              <div className={styles.titleRow}>
                <h1 className={styles.songTitleText} title={songTitle}>{songTitle}</h1>
                <button 
                  className={`${styles.likeBtn} ${likedSongIds.has(currentSong?.track_id) ? styles.liked : ''}`}
                  onClick={handleLike}
                  disabled={!currentSong}
                >
                  <Heart size={22} fill={likedSongIds.has(currentSong?.track_id) ? "var(--accent-danger)" : "transparent"} />
                </button>
              </div>
              <p className={styles.songArtistText}>{songArtist}</p>
              {currentSong?.track_genre && (
                <span className={styles.genreBadge}>{currentSong.track_genre}</span>
              )}
            </div>
          </div>

          {/* Progress Timeline Slider */}
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

          {/* Audio Playback Controls */}
          <div className={styles.controlButtons}>
            <button 
              className={`${styles.utilityBtn} ${isShuffle ? styles.activeUtility : ''}`}
              onClick={toggleShuffle}
              title="Phát ngẫu nhiên"
            >
              <Shuffle size={20} />
            </button>
            
            <button className={styles.playbackBtn} onClick={prevSong} disabled={queue.length === 0} title="Bài trước">
              <SkipBack size={24} fill="currentColor" />
            </button>

            <button 
              className={styles.playPauseBigBtn} 
              onClick={togglePlay}
              disabled={previewLoading || !currentSong}
            >
              {previewLoading ? (
                <span className={styles.spinner}>⟳</span>
              ) : isPlaying ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" style={{ marginLeft: '4px' }} />
              )}
            </button>

            <button className={styles.playbackBtn} onClick={nextSong} disabled={queue.length === 0} title="Bài tiếp theo">
              <SkipForward size={24} fill="currentColor" />
            </button>

            <button 
              className={`${styles.utilityBtn} ${repeatMode !== 'off' ? styles.activeUtility : ''}`}
              onClick={toggleRepeat}
              title={`Lặp lại: ${repeatMode}`}
            >
              <Repeat size={20} />
            </button>
          </div>

          {/* Volume control slider */}
          <div className={styles.volumeController}>
            <button className={styles.volumeIconBtn} onClick={handleMuteToggle}>
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className={styles.volumeBar} onClick={handleVolumeClick}>
              <div className={styles.volumeFill} style={{ width: `${volume * 100}%` }} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tabbed Sidebar */}
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
            >
              <Sparkles size={16} /> Gợi ý AI
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'lyrics' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('lyrics')}
            >
              <AlignLeft size={16} /> Lời nhạc
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'info' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <Info size={16} /> Thông tin
            </button>
          </div>

          <div className={styles.tabContent}>
            
            {/* TAB 1: Queue list waiting */}
            {activeTab === 'upnext' && (
              <div className={styles.queueWrapper}>
                {queue.length === 0 ? (
                  <div className={styles.emptyQueue}>
                    <Disc size={44} className={styles.emptyIcon} />
                    <p>Hàng chờ rỗng</p>
                    <span onClick={() => navigate('/home')}>Quay lại Trang Chủ để chọn nhạc</span>
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

            {/* TAB 2: AI Suggestions similar lists */}
            {activeTab === 'similar' && (
              <div className={styles.similarWrapper}>
                {!currentSong ? (
                  <p className={styles.noInfoText}>Vui lòng chọn bài hát để nạp gợi ý</p>
                ) : loadingSimilar ? (
                  <div className={styles.similarList}>
                    <div className={styles.similarBanner}>
                      🪄 Đang kích hoạt thuật toán Content KNN để đề xuất bài tương đồng...
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
                  <p className={styles.noInfoText}>Không tìm thấy bài hát nào tương tự</p>
                ) : (
                  <div className={styles.similarList}>
                    <div className={styles.similarBanner}>
                      🪄 Gợi ý thông minh dựa trên đặc trưng sóng âm (KNN Cosine)
                    </div>
                    {similarSongs.map((song, idx) => {
                      const isSongLiked = likedSongIds.has(song.track_id);
                      return (
                        <div 
                          key={song.track_id + '-' + idx} 
                          className={`${styles.similarItem} glass-panel`}
                          onClick={() => playSong(song, similarSongs)}
                        >
                          <span className={styles.similarIndex}>{idx + 1}</span>
                          <img src={song.cover_url || getCoverImage(song.track_id)} alt={song.track_name} className={styles.similarThumb} />
                          <div className={styles.similarInfo}>
                            <h4 className={styles.similarTitle}>{song.track_name}</h4>
                            <p className={styles.similarArtist}>{song.artists} • <span style={{ color: 'var(--accent-secondary)' }}>{song.track_genre}</span></p>
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
                            <Heart size={14} fill={isSongLiked ? 'var(--accent-danger)' : 'none'} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Autoscrolling lyrics with Click-to-Seek */}
            {activeTab === 'lyrics' && (
              <div className={styles.lyricsWrapper}>
                {!currentSong ? (
                  <p className={styles.noLyricsText}>Vui lòng chọn bài hát để xem lời nhạc</p>
                ) : (
                  <div className={styles.lyricsScrollList} ref={lyricsContainerRef}>
                    {lyrics.map((line, index) => {
                      const isActive = index === currentLyricIndex;
                      return (
                        <div 
                          key={index} 
                          className={`${styles.lyricLine} ${isActive ? styles.activeLyricLine : ''}`}
                          onClick={() => handleLyricClick(line.time)}
                          title={`Chuyển đến ${formatTime(line.time)}`}
                        >
                          <div className={styles.lyricIndicator}>
                            <span className={styles.lyricTime}>{formatTime(line.time)}</span>
                            <Play size={10} className={styles.lyricPlayIcon} fill="currentColor" />
                          </div>
                          <span className={styles.lyricText}>{line.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Metadata details view */}
            {activeTab === 'info' && (
              <div className={styles.infoWrapper}>
                {!currentSong ? (
                  <p className={styles.noInfoText}>Không tìm thấy siêu dữ liệu cho ca khúc này</p>
                ) : (
                  <div className={styles.infoDetails}>
                    <div className={styles.infoRow}>
                      <Award className={styles.infoRowIcon} size={18} />
                      <div>
                        <h5>Tác Phẩm</h5>
                        <p>{currentSong.track_name}</p>
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <Disc className={styles.infoRowIcon} size={18} />
                      <div>
                        <h5>Nghệ Sĩ</h5>
                        <p>{currentSong.artists}</p>
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <Info className={styles.infoRowIcon} size={18} />
                      <div>
                        <h5>Thể Loại</h5>
                        <p>{currentSong.track_genre || "Pop Lofi Core"}</p>
                      </div>
                    </div>
                    <div className={styles.infoCard}>
                      <h4>Hệ thống phát nhạc cao cấp VioTune</h4>
                      <p>Khám phá nhạc số chất lượng cao được lưu trữ đám mây tại Google Firebase Firestore REST API.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
};

export default PlayerPage;
