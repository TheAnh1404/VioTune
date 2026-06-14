import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { usePlayback } from '../context/PlaybackContext';
import SideBarMenu from './SideBarMenu/SideBarMenu';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import styles from './Recommendation.module.css';
import { ArrowLeft, Music, Users, Layers, Sparkles, RefreshCw } from "lucide-react";
import { API_URL } from '../config';
import { authenticatedFetch } from '../api';

const getCoverImage = (trackId) => {
  const images = [
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100",
    "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=100",
    "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=100",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100"
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

function Recommendation() {
  const navigate = useNavigate();
  const { user, logOut, likedSongsList, likedSongIds } = useAuth();
  const { playSong, currentSong } = usePlayback();

  const userIdAuth = user?.uid || 'anonymous';
  const username = user?.displayName || user?.email?.split('@')[0] || 'Music Lover';

  // State
  const userId = user?.uid || "";
  const [songQuery, setSongQuery] = useState("Atlantis");
  const [songId, setSongId] = useState("");
  const [selectedSong, setSelectedSong] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  
  // Results states
  const [cbRecs, setCbRecs] = useState([]);
  const [cfRecs, setCfRecs] = useState([]);
  const [hybridRecs, setHybridRecs] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search songs as user types (debounced and race-safe)
  useEffect(() => {
    if (!songQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let active = true;
    const controller = new AbortController();

    const searchSongs = async () => {
      try {
        const res = await fetch(
          `${API_URL}/songs/search?q=${encodeURIComponent(songQuery)}&limit=5`,
          { signal: controller.signal }
        );
        const json = await res.json();
        if (active && json.status === "success" && json.data.length > 0) {
          setSearchResults(json.data);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && active) {
          console.error("Search error:", err);
        }
      }
    };

    const delayDebounce = setTimeout(() => {
      searchSongs();
    }, 300);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(delayDebounce);
    };
  }, [songQuery]);

  const selectSong = (song) => {
    setSongId(song.track_id);
    setSelectedSong(song);
    setSongQuery(song.track_name);
    setSearchResults([]);
  };

  const runAlgorithms = async () => {
    if (!userId) {
      setError("Vui lòng cung cấp mã người dùng (User ID) để tính Collaborative Filtering.");
      return;
    }
    if (!songId) {
      setError("Vui lòng tìm và chọn một bài hát hạt giống (Seed Song) để tính KNN Content-Based.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // 1. Fetch Content-Based (CB) suggestions
      const cbRes = await fetch(`${API_URL}/recommend/content?song_id=${songId}&top_n=5`);
      const cbJson = await cbRes.json();
      
      // 2. Fetch Collaborative Filtering (CF) suggestions
      const cfRes = await authenticatedFetch(`${API_URL}/recommend/cf?user_id=${userId}&top_n=5`);
      const cfJson = await cfRes.json();
      
      // 3. Fetch Hybrid suggestions
      const hyRes = await authenticatedFetch(`${API_URL}/recommend?user_id=${userId}&song_id=${songId}&top_n=5`);
      const hyJson = await hyRes.json();

      const mapResult = (songs) => {
        return songs.map(track => {
          const hash = Math.abs(track.track_name.split("").reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
          return {
            ...track,
            track_id: track.track_id || `rec_${hash}`,
            cover_url: getCoverImage(track.track_id || track.track_name)
          };
        });
      };

      if (cbJson.status === "success") setCbRecs(mapResult(cbJson.data));
      if (cfJson.status === "success") setCfRecs(mapResult(cfJson.data));
      if (hyJson.status === "success") setHybridRecs(mapResult(hyJson.data));
    } catch (err) {
      setError("Lỗi kết nối máy chủ API: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song, songList = []) => {
    playSong(song, songList);
    navigate('/player');
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
    <div className={styles.container}>
      <Header 
        username={username}
        onLogOut={handleLogOut}
        showSearch={false}
      />

      <div className={styles.contentWrapper}>
        <SideBarMenu 
          userId={userIdAuth}
          likedSongs={likedSongsList}
          likedSongIds={likedSongIds}
          onPlaySong={(song) => handlePlaySong(song, likedSongsList)}
          currentSong={currentSong}
        />

        <div className={styles.mainContent}>
          {/* Back button and page title */}
          <div className={styles.headerArea}>
            <button onClick={() => navigate("/home")} className={styles.backBtn}>
              <ArrowLeft size={16} /> Quay lại trang chủ
            </button>
            <h1 className={styles.title}>🤖 Phòng Thí Nghiệm Đề Xuất & So Sánh Thuật Toán</h1>
            <p className={styles.subtitle}>Phân tích và chẩn đoán chi tiết các mô hình AI: SVD Latent Factors (Collaborative) và KNN (Content-Based) cạnh nhau.</p>
          </div>

          {/* Form input controls */}
          <div className={styles.formGrid}>
            
            {/* User Profile (CF) input card */}
            <div className={`${styles.inputCard} glass-panel`}>
              <div className={styles.cardHeader}>
                <Users size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 className={styles.cardTitle}>1. Thiết lập Hồ sơ Người dùng (SVD)</h3>
              </div>
              <p className={styles.cardDesc}>Chọn mã định danh người dùng. Hệ thống sẽ fold-in vector sở thích của họ từ ma trận dữ liệu Firestore.</p>
              <div className={styles.inputFieldWrapper}>
                <input
                  type="text"
                  value={userId}
                  readOnly
                  className={styles.inputStyle}
                  placeholder="Nhập User ID (Ví dụ: 42, 100 hoặc UID)"
                />
              </div>
              {userId === user?.uid && (
                <div className={styles.selectedBadge} style={{ background: 'rgba(139, 92, 246, 0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                  👤 Hồ sơ của bạn (Tài khoản đang đăng nhập)
                </div>
              )}
            </div>

            {/* Song seed (CB) input card */}
            <div className={`${styles.inputCard} glass-panel`}>
              <div className={styles.cardHeader}>
                <Music size={18} style={{ color: 'var(--accent-secondary)' }} />
                <h3 className={styles.cardTitle}>2. Lựa chọn Bài hát Hạt giống (KNN)</h3>
              </div>
              <p className={styles.cardDesc}>Tìm kiếm ca khúc làm tâm để tính toán các hệ số tương đồng Cosine dựa trên các chỉ số sóng âm học.</p>
              <div className={styles.inputFieldWrapper}>
                <input
                  type="text"
                  placeholder="Gõ tìm bài hát (Atlantis, Seafret, Pop...)"
                  value={songQuery}
                  onChange={(e) => setSongQuery(e.target.value)}
                  className={styles.inputStyle}
                />
                {searchResults.length > 0 && (
                  <div className={styles.dropdownList}>
                    {searchResults.map((song) => (
                      <div 
                        key={song.track_id} 
                        onClick={() => selectSong(song)}
                        className={styles.dropdownItem}
                      >
                        <strong>{song.track_name}</strong> - {song.artists} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({song.track_genre})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedSong && (
                <div className={styles.selectedBadge} style={{ background: 'rgba(6, 182, 212, 0.08)', color: 'var(--accent-secondary)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                  🌱 Hạt giống: <strong>{selectedSong.track_name}</strong> - {selectedSong.artists}
                </div>
              )}
            </div>
          </div>

          {/* Action trigger button */}
          <div className={styles.btnWrapper}>
            <button onClick={runAlgorithms} disabled={loading} className={styles.runBtn}>
              {loading ? (
                <>
                  <RefreshCw size={16} className={styles.spinning} />
                  <span>Đang giải mã ma trận tiềm ẩn...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Khởi Chạy & So Sánh Thuật Toán Đề Xuất</span>
                </>
              )}
            </button>
          </div>

          {error && <div className={styles.errorBox}>⚠️ {error}</div>}

          {/* Side-by-Side Benchmark columns panel */}
          <div className={styles.resultsGrid}>
            
            {/* 1. Content-Based (KNN) Panel */}
            <div className={`${styles.resultCol} glass-panel`}>
              <div className={styles.colHeader} style={{ borderColor: 'var(--accent-secondary)' }}>
                <Music size={18} style={{ color: 'var(--accent-secondary)' }} />
                <h4>KNN Content-Based Filtering</h4>
              </div>
              <p className={styles.algoDesc}>
                Tính toán độ tương đồng Cosine trên 7 thuộc tính âm học chuẩn hóa (danceability, energy, valence...) từ bài hát hạt giống.
              </p>
              
              <div className={styles.songList}>
                {cbRecs.length === 0 ? (
                  <div className={styles.noData}>Chưa có kết quả. Hãy bấm chạy so sánh ở trên.</div>
                ) : (
                  cbRecs.map((song, i) => {
                    const isCurrent = currentSong && currentSong.track_id === song.track_id;
                    return (
                      <div 
                        key={i} 
                        className={`${styles.songRow} ${isCurrent ? styles.activePlayingRow : ''}`}
                        onClick={() => handlePlaySong(song, cbRecs)}
                      >
                        <div className={styles.rankBadge}>{i + 1}</div>
                        <div className={styles.songInfo}>
                          <div className={styles.songName}>{song.track_name}</div>
                          <div className={styles.songArtist}>{song.artists}</div>
                        </div>
                        <span className={styles.genreBadge} style={{ background: 'rgba(6, 182, 212, 0.08)', color: 'var(--accent-secondary)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                          {song.track_genre || "Pop Lofi"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. Collaborative (SVD) Panel */}
            <div className={`${styles.resultCol} glass-panel`}>
              <div className={styles.colHeader} style={{ borderColor: 'var(--accent-primary)' }}>
                <Users size={18} style={{ color: 'var(--accent-primary)' }} />
                <h4>SVD Collaborative Filtering</h4>
              </div>
              <p className={styles.algoDesc}>
                Chiếu dữ liệu qua ma trận thừa số hóa ẩn tích hợp thuật toán Stochastic Gradient Descent (SGD) với 50 chiều tiềm ẩn của hồ sơ.
              </p>
              
              <div className={styles.songList}>
                {cfRecs.length === 0 ? (
                  <div className={styles.noData}>Chưa có kết quả. Hãy bấm chạy so sánh ở trên.</div>
                ) : (
                  cfRecs.map((song, i) => {
                    const isCurrent = currentSong && currentSong.track_id === song.track_id;
                    return (
                      <div 
                        key={i} 
                        className={`${styles.songRow} ${isCurrent ? styles.activePlayingRow : ''}`}
                        onClick={() => handlePlaySong(song, cfRecs)}
                      >
                        <div className={styles.rankBadge}>{i + 1}</div>
                        <div className={styles.songInfo}>
                          <div className={styles.songName}>{song.track_name}</div>
                          <div className={styles.songArtist}>{song.artists}</div>
                        </div>
                        <span className={styles.genreBadge} style={{ background: 'rgba(139, 92, 246, 0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                          {song.track_genre || "Pop Lofi"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Hybrid Blending Panel */}
            <div className={`${styles.resultCol} glass-panel`}>
              <div className={styles.colHeader} style={{ borderColor: 'var(--accent-tertiary)' }}>
                <Layers size={18} style={{ color: 'var(--accent-tertiary)' }} />
                <h4>Hybrid Fusion (KNN + SVD)</h4>
              </div>
              <p className={styles.algoDesc}>
                Fuses và trộn lẫn hai cơ chế trên thông qua thuật toán RRF (Reciprocal Rank Fusion) giúp tối ưu hóa độ chính xác và tránh cold-start.
              </p>
              
              <div className={styles.songList}>
                {hybridRecs.length === 0 ? (
                  <div className={styles.noData}>Chưa có kết quả. Hãy bấm chạy so sánh ở trên.</div>
                ) : (
                  hybridRecs.map((song, i) => {
                    const isCurrent = currentSong && currentSong.track_id === song.track_id;
                    return (
                      <div 
                        key={i} 
                        className={`${styles.songRow} ${isCurrent ? styles.activePlayingRow : ''}`}
                        style={{ borderLeft: '3px solid var(--accent-tertiary)' }}
                        onClick={() => handlePlaySong(song, hybridRecs)}
                      >
                        <div className={styles.rankBadge} style={{ background: 'var(--accent-tertiary)', color: '#000' }}>{i + 1}</div>
                        <div className={styles.songInfo}>
                          <div className={styles.songName}>{song.track_name}</div>
                          <div className={styles.songArtist}>{song.artists}</div>
                        </div>
                        <span className={styles.genreBadge} style={{ background: 'rgba(245, 158, 11, 0.08)', color: 'var(--accent-tertiary)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                          {song.track_genre || "Pop Lofi"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Recommendation;
