import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './SearchPage.module.css';
import { Play, Heart, Search, Music, Sparkles } from 'lucide-react';
import { API_URL } from '../../config';

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

const SearchPage = () => {
  const navigate = useNavigate();
  const { user, logOut, likeSong, unlikeSong, likedSongsList, likedSongIds } = useAuth();
  const { playSong, currentSong } = usePlayback();

  const userId = user?.uid || 'anonymous';
  const username = user?.displayName || user?.email?.split('@')[0] || 'Music Lover';

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search API Call with abort controller and debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let active = true;
    const controller = new AbortController();

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/songs/search?q=${encodeURIComponent(query)}&limit=20`,
          { signal: controller.signal }
        );
        const json = await res.json();
        if (active && json.status === "success") {
          setResults(json.data);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && active) {
          console.error("Search failed:", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 400);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(delayDebounce);
    };
  }, [query]);

  const handlePlay = (song) => {
    playSong(song, results);
    navigate('/player'); // Redirect to high fidelity cinema Player page
  };

  const handleLike = async (e, song) => {
    e.stopPropagation();
    if (!user) return;
    const isLiked = likedSongIds.has(song.track_id);
    if (isLiked) {
      await unlikeSong(song.track_id);
    } else {
      await likeSong(song);
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
    <div className={styles.searchPageContainer}>
      <Header 
        searchQuery={query}
        onSearchChange={setQuery}
        username={username}
        onLogOut={handleLogOut}
        showSearch={true} // Display top bar input too
      />
      <div className={styles.contentWrapper}>
        <SideBarMenu 
          userId={userId}
          likedSongs={likedSongsList}
          likedSongIds={likedSongIds}
          onPlaySong={(song) => {
            playSong(song, likedSongsList);
            navigate('/player');
          }}
          currentSong={currentSong}
        />
        <div className={styles.mainContent}>
          <div className={styles.searchHeaderSection}>
            <h1 className={styles.title}>Tìm Kiếm Bài Hát</h1>
            <p className={styles.subtitle}>Giải mã giai điệu bạn yêu thích với công cụ lọc thông minh VioTune Core</p>
            
            {/* Super premium large glowing search field */}
            <div className={styles.bigSearchBox}>
              <Search className={styles.searchIconBig} size={22} />
              <input 
                type="text"
                placeholder="Nhập tên bài hát, ca sĩ, thể loại hoặc từ khóa..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.bigSearchInput}
                autoFocus
              />
            </div>
          </div>

          <div className={styles.resultsSection}>
            {loading && (
              <div className={styles.resultsGridWrapper}>
                <h2 className={styles.sectionTitle}>Đang giải mã kết quả tìm kiếm...</h2>
                <div className={styles.resultsGrid}>
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div key={idx} className={styles.skeletonCard}>
                      <div className={styles.skeletonImage}>
                        <div className={styles.shimmer}></div>
                      </div>
                      <div className={styles.skeletonTitle}>
                        <div className={styles.shimmer}></div>
                      </div>
                      <div className={styles.skeletonArtist}>
                        <div className={styles.shimmer}></div>
                      </div>
                      <div className={styles.skeletonBadge}>
                        <div className={styles.shimmer}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className={styles.noResults}>
                <Music size={48} className={styles.noResultsIcon} />
                <h3>Không tìm thấy giai điệu tương ứng</h3>
                <p>Hãy thử tìm kiếm theo nghệ sĩ khác hoặc kiểm tra lại từ khóa.</p>
              </div>
            )}

            {!query && (
              <div className={styles.searchPlaceholder}>
                <Sparkles size={56} className={styles.placeholderIcon} />
                <h3>Sẵn Sàng Khám Phá Giai Điệu Mới</h3>
                <p>Nhập từ khóa tìm kiếm phía trên để khai phá kho tàng âm nhạc VioTune</p>
              </div>
            )}

            {results.length > 0 && (
              <div className={styles.resultsGridWrapper}>
                <h2 className={styles.sectionTitle}>Kết quả tìm thấy ({results.length})</h2>
                <div className={styles.resultsGrid}>
                  {results.map((song) => {
                    const isLiked = likedSongIds.has(song.track_id);
                    const cover = song.cover_url || getCoverImage(song.track_id);
                    return (
                      <div 
                        key={song.track_id} 
                        className={`${styles.songCard} glass-panel`}
                        onClick={() => handlePlay(song)}
                      >
                        <div className={styles.imageWrapper}>
                          <img src={cover} alt={song.track_name} className={styles.songCover} />
                          <div className={styles.playOverlay}>
                            <Play size={26} fill="white" className={styles.playIcon} />
                          </div>
                        </div>
                        <div className={styles.songInfoArea}>
                          <h4 className={styles.songTitle} title={song.track_name}>{song.track_name}</h4>
                          <p className={styles.songArtist}>{song.artists}</p>
                          {song.track_genre && <span className={styles.genreBadge}>{song.track_genre}</span>}
                        </div>
                        <button 
                          className={`${styles.likeBtn} ${isLiked ? styles.liked : ''}`}
                          onClick={(e) => handleLike(e, song)}
                        >
                          <Heart size={16} fill={isLiked ? "var(--accent-danger)" : "transparent"} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
