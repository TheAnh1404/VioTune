import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import QueuePanel from '../../components/QueuePanel/QueuePanel';
import styles from './HomePage.module.css';
import MusicPlayer from '../../components/MusicPlayer/MusicPlayer';
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';
import { API_URL } from '../../config';
import { 
  Sparkles, Sliders, Cpu, Heart, Play, RefreshCw, 
  Search, Music, Activity, Flame, Library, Music2, 
  ArrowRight, Radio, Star, Layers, Disc
} from 'lucide-react';

const getCoverImage = (trackId) => {
  const images = [
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300",
    "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=300",
    "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=300",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300"
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

const HomePage = () => {
  const navigate = useNavigate();
  
  // ── Auth context (Hoisted Global State) ───────────────────────────────────────
  const { 
    user, logOut, likeSong, unlikeSong, 
    likedSongsList: likedSongs, likedSongIds 
  } = useAuth();
  const userId = user?.uid || 'anonymous';
  const username = user?.displayName || user?.email?.split('@')[0] || 'Music Lover';

  // ── Playback Context (Global State) ───────────────────────────────────────────
  const {
    currentSong, setCurrentSong,
    isPlaying,
    queue, setQueue,
    currentIndex, setCurrentIndex,
    duration, currentTime,
    volume, setVolume,
    repeatMode, isShuffle,
    previewUrl, previewLoading,
    showQueue, setShowQueue,
    playSong, togglePlay, seek,
    nextSong, prevSong, toggleRepeat, toggleShuffle, clearQueue
  } = usePlayback();

  // ── Core Dashboard States ─────────────────────────────────────────────────────
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [popularArtists, setPopularArtists] = useState([]);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [playlistTitle, setPlaylistTitle] = useState("");
  
  // ── AI recommendation States ──────────────────────────────────────────────────
  const [alpha, setAlpha] = useState(0.5);
  const [seedSong, setSeedSong] = useState(null);
  const [recs, setRecs] = useState([]);
  const [taste, setTaste] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  
  // Search seed states
  const [seedQuery, setSeedQuery] = useState("");
  const [seedSearchResults, setSeedSearchResults] = useState([]);
  const [showSeedDropdown, setShowSeedDropdown] = useState(false);

  // Model retrain state
  const [retrainStatus, setRetrainStatus] = useState("");
  const [retrainLoading, setRetrainLoading] = useState(false);

  // ── 1. Initial Data Fetching on Mount ─────────────────────────────────────────
  useEffect(() => {
    const fetchPopularArtists = async () => {
      try {
        const res = await fetch(`${API_URL}/artists?limit=8`);
        const json = await res.json();
        if (json.status === "success") {
          setPopularArtists(json.data);
        }
      } catch (err) {
        console.error("Error fetching popular artists:", err);
      }
    };

    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_URL}/songs/random?limit=10`);
        const json = await res.json();
        if (json.status === "success") {
          setTrendingSongs(json.data);
          // Load default queue if empty
          if (json.data.length > 0 && !currentSong) {
            setCurrentSong(json.data[0]);
            setQueue(json.data);
            setCurrentIndex(0);
          }
        }
      } catch (err) {
        console.error("Error fetching trending songs:", err);
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/songs/history?user_id=${userId}`);
        const json = await res.json();
        if (json.status === "success") {
          setRecentSongs(json.data.slice(0, 5));
        }
      } catch (err) {
        console.warn("Failed to load user history:", err);
      }
    };

    fetchPopularArtists();
    fetchTrending();
    if (user) {
      fetchHistory();
    }
  }, [user, userId]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // ── 2. Sync Seed Song with Active Song or Fetch Default ───────────────────────
  useEffect(() => {
    if (currentSong) {
      setSeedSong(currentSong);
      setSeedQuery(currentSong.track_name);
    } else if (!seedSong) {
      const fetchDefaultSeed = async () => {
        try {
          const res = await fetch(`${API_URL}/songs/random?limit=1`);
          const json = await res.json();
          if (json.status === "success" && json.data.length > 0) {
            setSeedSong(json.data[0]);
            setSeedQuery(json.data[0].track_name);
          }
        } catch (err) {
          console.error("Failed to load default seed:", err);
        }
      };
      fetchDefaultSeed();
    }
  }, [currentSong]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // ── 3. Fetch User Taste Profile (Acoustic DNA) ───────────────────────────────
  useEffect(() => {
    const fetchTasteProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${userId}/taste-profile`);
        const json = await res.json();
        if (json.status === "success") {
          setTaste(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch taste profile:", err);
      }
    };
    if (userId) {
      fetchTasteProfile();
    }
  }, [userId, likedSongs?.length]);

  // ── 4. Search Seeds on Debounced input ────────────────────────────────────────
  useEffect(() => {
    if (!seedQuery.trim() || seedQuery === seedSong?.track_name) {
      setSeedSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/songs/search?q=${encodeURIComponent(seedQuery)}&limit=5`);
        const json = await res.json();
        if (json.status === "success") {
          setSeedSearchResults(json.data);
        }
      } catch (err) {
        console.error("Search seed failed:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [seedQuery, seedSong]);

  // ── 5. Fetch Hybrid Recommendations ───────────────────────────────────────────
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId || !seedSong) return;
      setLoadingRecs(true);
      try {
        const res = await fetch(`${API_URL}/recommend?user_id=${userId}&song_id=${seedSong.track_id}&alpha=${alpha}&top_n=6`);
        const json = await res.json();
        if (json.status === "success") {
          const tracks = json.data.map(track => {
            const hash = Math.abs(track.track_name.split("").reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
            return {
              ...track,
              track_id: track.track_id || `rec_${hash}`,
              cover_url: getCoverImage(track.track_id || track.track_name)
            };
          });
          setRecs(tracks);
        }
      } catch (err) {
        console.error("Failed to generate hybrid recommendations:", err);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchRecommendations();
  }, [userId, seedSong, alpha]);

  // ── Tuner Actions ─────────────────────────────────────────────────────────────
  const selectSeed = (song) => {
    setSeedSong(song);
    setSeedQuery(song.track_name);
    setShowSeedDropdown(false);
  };

  const handleRetrain = async () => {
    setRetrainLoading(true);
    setRetrainStatus("Kích hoạt SGD Matrix Factorization...");
    try {
      const res = await fetch(`${API_URL}/recommend/retrain`, { method: 'POST' });
      const json = await res.json();
      if (json.status === "success") {
        setRetrainStatus("Đã tái huấn luyện SVD thành công!");
        setTimeout(() => setRetrainStatus(""), 4000);
      }
    } catch (err) {
      setRetrainStatus("Lỗi tái huấn luyện SVD: " + err.message);
    } finally {
      setRetrainLoading(false);
    }
  };

  const getAlphaLabel = () => {
    if (alpha === 0) return "100% SVD Collaborative Filtering";
    if (alpha === 1) return "100% KNN Content-Based";
    if (alpha === 0.5) return "Đồng bộ cân bằng Hybrid (50% / 50%)";
    return `Cơ chế kết hợp Hybrid (Content: ${(alpha * 100).toFixed(0)}% | SVD: ${((1 - alpha) * 100).toFixed(0)}%)`;
  };

  // ── Audio control proxies ─────────────────────────────────────────────────────
  const handlePlaySong = (song, songList = []) => {
    let targetQueue = songList;
    if (!targetQueue || targetQueue.length === 0) {
      if (playlistSongs.some(s => s.track_id === song.track_id)) {
        targetQueue = playlistSongs;
      } else if (trendingSongs.some(s => s.track_id === song.track_id)) {
        targetQueue = trendingSongs;
      } else if (recs.some(s => s.track_id === song.track_id)) {
        targetQueue = recs;
      } else {
        targetQueue = [song];
      }
    }

    playSong(song, targetQueue);
    
    // Add to local recent history state optimistically
    setRecentSongs(prev => {
      const filtered = prev.filter(s => s.track_id !== song.track_id);
      return [song, ...filtered].slice(0, 5);
    });

    navigate('/player');
  };

  const handleLikeToggle = async (song) => {
    if (!user) return;
    const isLiked = likedSongIds.has(song.track_id);
    if (isLiked) {
      await unlikeSong(song.track_id);
    } else {
      await likeSong(song);
    }
  };

  const handleSelectGenrePlaylist = async (playlistName, genreName) => {
    try {
      const res = await fetch(`${API_URL}/playlists/${genreName}/songs?limit=15`);
      const json = await res.json();
      if (json.status === "success") {
        setPlaylistSongs(json.data);
        setPlaylistTitle(playlistName);
        
        // Load target queue and play immediately
        if (json.data.length > 0) {
          playSong(json.data[0], json.data);
          navigate('/player');
        }
      }
    } catch (err) {
      console.error("Error loading playlist songs:", err);
    }
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
    <div className={styles.homeContainer}>
      <Header 
        username={username} 
        onLogOut={handleLogOut}
        showSearch={false}
      />
      <div className={styles.contentWrapper}>
        <SideBarMenu 
          userId={userId}
          likedSongs={likedSongs}
          likedSongIds={likedSongIds}
          refreshTrigger={likedSongs?.length || 0}
          onPlaySong={handlePlaySong}
          currentSong={currentSong}
        />
        <div className={styles.mainContent}>
          <div className={styles.dashboardLayout}>
            
            {/* 1. WELCOME HERO SECTION */}
            <div className={`${styles.welcomePanel} glass-panel`}>
              <div className={styles.welcomeText}>
                <h1>Chào mừng trở lại, <span className="gradient-text-purple-cyan">{username}</span>!</h1>
                <p>Khám phá hệ sinh thái AI Music cao cấp được tối ưu hóa cho gu âm nhạc cá nhân của bạn.</p>
              </div>
              <div className={styles.tasteProfileSummary}>
                {taste && (
                  <>
                    <div className={styles.tastePill}>
                      <Star size={16} />
                      <span>{taste.favorite_genre || "Pop Lofi"}</span>
                    </div>
                    <div className={styles.tastePill}>
                      <Library size={16} />
                      <span>Thư viện: {likedSongs.length} bài hát</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. DUAL LAYOUT: AI recommendation engine on left, dynamic grids on right */}
            <div className={styles.splitGrid}>
              
              {/* LEFT: AI Recommendation Engine */}
              <div className={`${styles.aiStationCard} glass-panel`}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}>
                    <Sparkles size={20} />
                  </div>
                  <div className={styles.cardHeaderInfo}>
                    <h3>Trạm Gợi Ý VioTune AI</h3>
                    <p>Bản đồ DNA âm nhạc thời gian thực</p>
                  </div>
                </div>

                {/* Acoustic DNA Profile */}
                <div className={styles.dnaMetricsList}>
                  {taste ? (
                    <>
                      <div className={styles.dnaItem}>
                        <div className={styles.dnaLabel}>
                          <span>Danceability (Nhịp điệu sôi động)</span>
                          <span className={styles.dnaValue}>{(taste.danceability * 100).toFixed(0)}%</span>
                        </div>
                        <div className={styles.dnaBarTrack}>
                          <div className={styles.dnaBarFill} style={{ width: `${taste.danceability * 100}%` }} />
                        </div>
                      </div>

                      <div className={styles.dnaItem}>
                        <div className={styles.dnaLabel}>
                          <span>Energy (Cường độ âm thanh)</span>
                          <span className={styles.dnaValue}>{(taste.energy * 100).toFixed(0)}%</span>
                        </div>
                        <div className={styles.dnaBarTrack}>
                          <div className={styles.dnaBarFill} style={{ width: `${taste.energy * 100}%` }} />
                        </div>
                      </div>

                      <div className={styles.dnaItem}>
                        <div className={styles.dnaLabel}>
                          <span>Valence (Cảm xúc vui tươi)</span>
                          <span className={styles.dnaValue}>{(taste.valence * 100).toFixed(0)}%</span>
                        </div>
                        <div className={styles.dnaBarTrack}>
                          <div className={styles.dnaBarFill} style={{ width: `${taste.valence * 100}%` }} />
                        </div>
                      </div>

                      <div className={styles.dnaItem}>
                        <div className={styles.dnaLabel}>
                          <span>Acousticness (Nhạc cụ mộc)</span>
                          <span className={styles.dnaValue}>{(taste.acousticness * 100).toFixed(0)}%</span>
                        </div>
                        <div className={styles.dnaBarTrack}>
                          <div className={styles.dnaBarFill} style={{ width: `${taste.acousticness * 100}%` }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.loadingWrapper}>
                      <span className={styles.spinning}>⟳</span> &nbsp; Đang giải mã Acoustic DNA...
                    </div>
                  )}
                </div>

                {/* Hybrid Fusion Tuner controls */}
                <div className={styles.hybridTuner}>
                  <div className={styles.tunerHeader}>
                    <span>Bộ chỉnh luồng thuật toán</span>
                    <span style={{ color: 'var(--accent-secondary)' }}><Sliders size={16} /></span>
                  </div>

                  {/* Seed Song Input */}
                  <div className={styles.seedSelectGroup}>
                    <div className={styles.tunerLabel}>Hạt giống KNN Content-based:</div>
                    <div className={styles.seedSearchWrapper}>
                      <Search size={14} className={styles.seedSearchIcon} />
                      <input 
                        type="text"
                        value={seedQuery}
                        onChange={(e) => {
                          setSeedQuery(e.target.value);
                          setShowSeedDropdown(true);
                        }}
                        onFocus={() => setShowSeedDropdown(true)}
                        placeholder="Tìm bài hát làm hạt giống gợi ý..."
                        className={styles.seedSearchInput}
                      />
                      
                      {showSeedDropdown && seedSearchResults.length > 0 && (
                        <div className={styles.seedSearchDropdown}>
                          {seedSearchResults.map((song) => (
                            <div key={song.track_id} className={styles.dropdownItem} onClick={() => selectSeed(song)}>
                              <Music size={14} style={{ color: 'var(--accent-secondary)' }} />
                              <div className={styles.dropdownInfo}>
                                <span className={styles.dropdownTitle}>{song.track_name}</span>
                                <span className={styles.dropdownArtist}>{song.artists}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Range Slider for hybrid alpha blending */}
                  <div className={styles.seedSelectGroup}>
                    <div className={styles.tunerLabelRow}>
                      <span>Collaborative SVD</span>
                      <span style={{ color: 'var(--accent-secondary)' }}>{(alpha).toFixed(2)}</span>
                      <span>Content KNN</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={alpha}
                      onChange={(e) => setAlpha(parseFloat(e.target.value))}
                      className={styles.rangeInput}
                    />
                    <div className={styles.tunerLabelRow} style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px' }}>
                      <span>Dựa trên sở thích người dùng</span>
                      <span>Dựa trên đặc tính âm học bài hát</span>
                    </div>
                  </div>

                  <div className={styles.retrainSection}>
                    <div className={styles.tunerLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Cpu size={12} />
                      <span>SVD Latent: 50 Dimensions</span>
                    </div>
                    <button className={styles.retrainBtn} onClick={handleRetrain} disabled={retrainLoading}>
                      <RefreshCw size={12} className={retrainLoading ? styles.spinning : ''} />
                      <span>Huấn luyện lại SVD</span>
                    </button>
                  </div>
                  {retrainStatus && <div className={styles.retrainStatus}>{retrainStatus}</div>}
                </div>

                {/* AI Rec List */}
                <div className={styles.aiRecsWrapper}>
                  <div className={styles.recsHeader}>
                    <h4>Danh sách gợi ý thông minh ({recs.length})</h4>
                    {loadingRecs && <span className={styles.spinning}>⟳</span>}
                  </div>

                  <div className={styles.recsGrid}>
                    {recs.map((song, idx) => {
                      const isLiked = likedSongIds.has(song.track_id);
                      return (
                        <div 
                          key={song.track_id + '-' + idx} 
                          className={`${styles.recRow} glass-panel`}
                          onClick={() => handlePlaySong(song, recs)}
                        >
                          <img src={song.cover_url} alt={song.track_name} />
                          <div className={styles.recMeta}>
                            <span className={styles.recName}>{song.track_name}</span>
                            <span className={styles.recArtist}>{song.artists}</span>
                          </div>
                          <div className={styles.recRowActions} onClick={(e) => e.stopPropagation()}>
                            <button 
                              className={`${styles.likeBtn} ${isLiked ? styles.liked : ''}`}
                              onClick={() => handleLikeToggle(song)}
                            >
                              <Heart size={14} fill={isLiked ? "var(--accent-danger)" : "transparent"} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT: Dynamic Grids */}
              <div className={styles.rightCol}>
                
                {/* Hot Tracks Trending Now */}
                <section>
                  <h2 className={styles.sectionTitle}>
                    <Flame className={styles.titleIconGlow} size={22} /> Giai Điệu Thịnh Hành
                  </h2>
                  <div className={styles.trackGrid}>
                    {trendingSongs.slice(0, 5).map((song) => {
                      const isLiked = likedSongIds.has(song.track_id);
                      const cover = song.cover_url || getCoverImage(song.track_id);
                      return (
                        <div 
                          key={song.track_id} 
                          className={`${styles.trackCard} glass-panel`}
                          onClick={() => handlePlaySong(song, trendingSongs)}
                        >
                          <div className={styles.imageContainer}>
                            <img src={cover} alt={song.track_name} />
                            <div className={styles.playOverlay}>
                              <div className={styles.playIconCircle}>
                                <Play size={20} fill="white" />
                              </div>
                            </div>
                          </div>
                          <div className={styles.trackDetails}>
                            <h4 className={styles.trackNameText} title={song.track_name}>{song.track_name}</h4>
                            <p className={styles.trackArtistText}>{song.artists}</p>
                            {song.track_genre && <span className={styles.genreBadge}>{song.track_genre}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Curated Genre Playlists */}
                <section>
                  <h2 className={styles.sectionTitle}>
                    <Radio className={styles.titleIconGlow} size={22} /> Khám Phá Chủ Đề & Thể Loại
                  </h2>
                  <div className={styles.playlistGrid}>
                    <div className={`${styles.playlistCard} glass-panel`} onClick={() => handleSelectGenrePlaylist("Lofi Chill-out", "lofi")}>
                      <div className={styles.playlistIconBox}>
                        <Music2 size={24} />
                      </div>
                      <div className={styles.playlistInfo}>
                        <h4>Lofi Chill-out</h4>
                        <p>Âm hưởng lofi êm dịu, thư giãn tối đa cho tinh thần.</p>
                      </div>
                    </div>

                    <div className={`${styles.playlistCard} glass-panel`} onClick={() => handleSelectGenrePlaylist("Pop Populating", "pop")}>
                      <div className={styles.playlistIconBox} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}>
                        <Disc size={24} />
                      </div>
                      <div className={styles.playlistInfo}>
                        <h4>Pop Populating</h4>
                        <p>Các khúc ca pop sôi động, hiện đại và trẻ trung.</p>
                      </div>
                    </div>

                    <div className={`${styles.playlistCard} glass-panel`} onClick={() => handleSelectGenrePlaylist("Rock & Roll Legacy", "rock")}>
                      <div className={styles.playlistIconBox} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)' }}>
                        <Flame size={24} />
                      </div>
                      <div className={styles.playlistInfo}>
                        <h4>Rock & Roll Legacy</h4>
                        <p>Giai điệu mạnh mẽ, ghi-ta điện rực cháy đầy uy lực.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Popular Artists Circular grid */}
                {popularArtists.length > 0 && (
                  <section>
                    <h2 className={styles.sectionTitle}>
                      <Activity className={styles.titleIconGlow} size={22} /> Nghệ Sĩ Được Yêu Thích
                    </h2>
                    <div className={styles.artistRow}>
                      {popularArtists.map((artist, idx) => {
                        const artistImg = `https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=120&auto=format&fit=crop&q=80`;
                        return (
                          <div 
                            key={idx} 
                            className={styles.artistCircularCard}
                            onClick={() => navigate(`/artist/${encodeURIComponent(artist.artists)}`)}
                          >
                            <div className={styles.artistAvatar}>
                              <img src={artistImg} alt={artist.artists} />
                            </div>
                            <span className={styles.artistNameText}>{artist.artists}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* User Listening History */}
                {recentSongs.length > 0 && (
                  <section>
                    <h2 className={styles.sectionTitle}>
                      <Library className={styles.titleIconGlow} size={22} /> Đã Nghe Gần Đây
                    </h2>
                    <div className={styles.trackGrid}>
                      {recentSongs.map((song, idx) => {
                        const cover = song.cover_url || getCoverImage(song.track_id);
                        return (
                          <div 
                            key={song.track_id + '-' + idx} 
                            className={`${styles.trackCard} glass-panel`}
                            onClick={() => handlePlaySong(song, recentSongs)}
                          >
                            <div className={styles.imageContainer}>
                              <img src={cover} alt={song.track_name} />
                              <div className={styles.playOverlay}>
                                <div className={styles.playIconCircle}>
                                  <Play size={20} fill="white" />
                                </div>
                              </div>
                            </div>
                            <div className={styles.trackDetails}>
                              <h4 className={styles.trackNameText} title={song.track_name}>{song.track_name}</h4>
                              <p className={styles.trackArtistText}>{song.artists}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </div>

            <Footer />
          </div>

          {/* Queue Panel Drawer Slider */}
          <div className={`${styles.queueDrawer} ${showQueue ? styles.queueDrawerOpen : ''}`}>
            <QueuePanel 
              queue={queue}
              currentIndex={currentIndex}
              currentSong={currentSong}
              onPlaySong={handlePlaySong}
              onClearQueue={clearQueue}
              onClose={() => setShowQueue(false)}
            />
          </div>
        </div>
      </div>
      
      <MusicPlayer 
        currentSong={currentSong} 
        isPlaying={isPlaying} 
        onTogglePlay={togglePlay} 
        duration={duration}
        currentTime={currentTime}
        onSeek={seek}
        onNext={nextSong}
        onPrev={prevSong}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        onToggleRepeat={toggleRepeat}
        onToggleShuffle={toggleShuffle}
        onToggleQueue={() => setShowQueue(prev => !prev)}
        showQueue={showQueue}
        volume={volume}
        onVolumeChange={setVolume}
        previewLoading={previewLoading}
        previewUrl={previewUrl}
        onMaximize={() => navigate('/player')}
      />
    </div>
  );
};

export default HomePage;