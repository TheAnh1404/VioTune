import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './PlaylistsPage.module.css';
import { 
  Play, Plus, Music, Trash2, Calendar, FolderHeart, 
  Sparkles, ListMusic, Heading1, AlertCircle, Heart 
} from 'lucide-react';
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

const formatDate = (dateString) => {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
};

const PlaylistsPage = () => {
  const navigate = useNavigate();
  const { user, logOut, likedSongsList, likedSongIds } = useAuth();
  const { playSong, currentSong } = usePlayback();
  
  const userId = user?.uid || 'anonymous';
  const username = user?.displayName || user?.email?.split('@')[0] || 'Music Lover';

  // State
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDesc, setPlaylistDesc] = useState("");
  const [modalError, setModalError] = useState("");

  // 1. Fetch playlists on mount
  const fetchPlaylists = async () => {
    if (!user) return;
    setLoadingPlaylists(true);
    try {
      const res = await fetch(`${API_URL}/users/${user.uid}/playlists`);
      const json = await res.json();
      if (json.status === "success") {
        setPlaylists(json.data);
        if (json.data.length > 0 && !activePlaylist) {
          setActivePlaylist(json.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2. Fetch songs of active playlist
  useEffect(() => {
    const fetchPlaylistSongs = async () => {
      if (!activePlaylist) {
        setPlaylistSongs([]);
        return;
      }
      setLoadingSongs(true);
      try {
        const res = await fetch(`${API_URL}/playlists/${activePlaylist.playlist_id}/songs`);
        const json = await res.json();
        if (json.status === "success") {
          setPlaylistSongs(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch playlist songs:", err);
      } finally {
        setLoadingSongs(false);
      }
    };
    fetchPlaylistSongs();
  }, [activePlaylist]);

  // 3. Create a new playlist
  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!playlistName.trim()) {
      setModalError("Vui lòng nhập tên danh sách phát.");
      return;
    }
    setModalError("");
    try {
      const res = await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          name: playlistName.trim(),
          description: playlistDesc.trim() || null
        })
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        setShowModal(false);
        setPlaylistName("");
        setPlaylistDesc("");
        // Reload playlists and select new one
        const updatedRes = await fetch(`${API_URL}/users/${user.uid}/playlists`);
        const updatedJson = await updatedRes.json();
        if (updatedJson.status === "success") {
          setPlaylists(updatedJson.data);
          const newPlaylist = updatedJson.data.find(p => p.playlist_id === json.data.playlist_id);
          if (newPlaylist) setActivePlaylist(newPlaylist);
        }
      } else {
        setModalError(json.detail || "Không thể tạo danh sách phát.");
      }
    } catch (err) {
      setModalError("Lỗi kết nối máy chủ.");
    }
  };

  // 4. Remove song from playlist
  const handleRemoveSong = async (e, trackId) => {
    e.stopPropagation();
    if (!activePlaylist) return;
    try {
      const res = await fetch(`${API_URL}/playlists/${activePlaylist.playlist_id}/songs/${trackId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.status === "success") {
        // Refresh local playlist songs state optimistically
        setPlaylistSongs(prev => prev.filter(s => s.track_id !== trackId));
      }
    } catch (err) {
      console.error("Failed to remove song:", err);
    }
  };

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      playSong(playlistSongs[0], playlistSongs);
      navigate('/player');
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
    <div className={styles.playlistsPageContainer}>
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
            navigate('/player');
          }}
          currentSong={currentSong}
        />
        <div className={styles.mainContent}>
          <div className={styles.playlistPanel}>
            {/* LEFT COLUMN: Playlists list */}
            <div className={styles.leftCol}>
              <div className={styles.listHeader}>
                <h2 className={styles.colTitle}><ListMusic size={22} className={styles.titleIcon} /> Danh sách phát</h2>
                <button className={styles.createBtn} onClick={() => setShowModal(true)} title="Tạo playlist mới">
                  <Plus size={18} /> Tạo mới
                </button>
              </div>

              {loadingPlaylists && (
                <div className={styles.loader}>Đang tải...</div>
              )}

              {!loadingPlaylists && playlists.length === 0 && (
                <div className={styles.noPlaylists}>
                  <FolderHeart size={44} className={styles.emptyIcon} />
                  <p>Chưa có danh sách phát cá nhân nào.</p>
                  <button onClick={() => setShowModal(true)} className={styles.createBtnBig}>Tạo Playlist Ngay</button>
                </div>
              )}

              {playlists.length > 0 && (
                <div className={styles.playlistListItems}>
                  {playlists.map((pl) => {
                    const isSelected = activePlaylist && activePlaylist.playlist_id === pl.playlist_id;
                    return (
                      <div 
                        key={pl.playlist_id} 
                        className={`${styles.playlistItem} ${isSelected ? styles.playlistItemActive : ''}`}
                        onClick={() => setActivePlaylist(pl)}
                      >
                        <div className={styles.playlistThumb}>
                          <ListMusic size={20} />
                        </div>
                        <div className={styles.playlistMeta}>
                          <h4 className={styles.plName}>{pl.name}</h4>
                          <p className={styles.plDesc}>{pl.description || "Danh sách phát tùy chỉnh"}</p>
                        </div>
                        {isSelected && <div className={styles.activeIndicator} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Active playlist details & songs */}
            <div className={styles.rightCol}>
              {!activePlaylist ? (
                <div className={styles.noActivePlaylist}>
                  <Sparkles size={64} className={styles.welcomeSparkle} />
                  <h3>Không gian lưu trữ cá nhân</h3>
                  <p>Chọn một danh sách phát ở cột bên trái hoặc tạo danh sách phát mới để xem bài hát</p>
                </div>
              ) : (
                <div className={styles.activePlaylistContainer}>
                  {/* Playlist Banner Header */}
                  <div className={styles.playlistBanner}>
                    <div className={styles.bannerArt}>
                      <FolderHeart size={64} color="#a78bfa" />
                    </div>
                    <div className={styles.bannerDetails}>
                      <span className={styles.bannerLabel}>PLAYLIST CÁ NHÂN</span>
                      <h1 className={styles.bannerTitle}>{activePlaylist.name}</h1>
                      <p className={styles.bannerDesc}>{activePlaylist.description || "Không có mô tả chi tiết cho danh sách phát này."}</p>
                      <div className={styles.bannerStats}>
                        <span className={styles.statItem}>Người tạo: <strong>{username}</strong></span>
                        <span className={styles.statDivider}>•</span>
                        <span className={styles.statItem}>{playlistSongs.length} bài hát</span>
                      </div>
                    </div>
                    {playlistSongs.length > 0 && (
                      <button className={styles.playAllBigBtn} onClick={handlePlayAll}>
                        <Play size={22} fill="white" /> Phát tất cả
                      </button>
                    )}
                  </div>

                  {/* Songs list */}
                  <div className={styles.tracksSection}>
                    {loadingSongs ? (
                      <div className={styles.tracksLoader}>Đang nạp danh sách bài hát...</div>
                    ) : playlistSongs.length === 0 ? (
                      <div className={styles.emptyTracks}>
                        <Music size={48} className={styles.emptyTracksIcon} />
                        <h4>Playlist này chưa có nhạc</h4>
                        <p>Hãy vào trang Tìm Kiếm hoặc xem các gợi ý bài hát ở Trang Chủ để thêm nhạc vào đây</p>
                        <button onClick={() => navigate('/search')} className={styles.searchRedirectBtn}>Khám phá bài hát</button>
                      </div>
                    ) : (
                      <div className={styles.songsTable}>
                        <div className={styles.tableHeaderRow}>
                          <span className={styles.colIndex}>#</span>
                          <span className={styles.colTitleHeader}>TIÊU ĐỀ</span>
                          <span className={styles.colGenreHeader}>THỂ LOẠI</span>
                          <span className={styles.colDateHeader}>NGÀY THÊM</span>
                          <span className={styles.colActionHeader}></span>
                        </div>
                        
                        <div className={styles.tableBody}>
                          {playlistSongs.map((song, idx) => {
                            const isCurrent = currentSong && currentSong.track_id === song.track_id;
                            const cover = song.cover_url || getCoverImage(song.track_id);
                            return (
                              <div 
                                key={song.track_id + '-' + idx} 
                                className={`${styles.songRow} ${isCurrent ? styles.activeSongRow : ''}`}
                                onClick={() => {
                                  playSong(song, playlistSongs);
                                  navigate('/player');
                                }}
                              >
                                <span className={styles.colIndex}>
                                  {isCurrent ? <Play size={14} fill="#a78bfa" color="#a78bfa" /> : idx + 1}
                                </span>
                                <div className={styles.colTitleArea}>
                                  <img src={cover} alt={song.track_name} className={styles.songCover} />
                                  <div className={styles.songText}>
                                    <h4 className={styles.songName} title={song.track_name}>{song.track_name}</h4>
                                    <p 
                                      className={styles.songArtist}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/artist/${encodeURIComponent(song.artists)}`);
                                      }}
                                    >
                                      {song.artists}
                                    </p>
                                  </div>
                                </div>
                                <span className={styles.colGenre}>
                                  {song.track_genre && <span className={styles.genreBadge}>{song.track_genre}</span>}
                                </span>
                                <span className={styles.colDate}>
                                  <Calendar size={14} style={{ marginRight: '6px' }} /> {formatDate(song.added_at)}
                                </span>
                                <div className={styles.colAction}>
                                  <button 
                                    className={styles.deleteSongBtn}
                                    onClick={(e) => handleRemoveSong(e, song.track_id)}
                                    title="Xóa bài hát khỏi playlist"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <Footer />
        </div>
      </div>

      {/* CREATE PLAYLIST MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Tạo danh sách phát mới</h3>
              <button className={styles.closeModalBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePlaylist} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label>Tên Playlist</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Lofi Chill, Nhạc tập trung..."
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  maxLength={40}
                  required
                  autoFocus
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Mô tả ngắn</label>
                <textarea 
                  placeholder="Viết vài dòng mô tả về danh sách phát này..."
                  value={playlistDesc}
                  onChange={(e) => setPlaylistDesc(e.target.value)}
                  maxLength={150}
                  rows={3}
                />
              </div>

              {modalError && (
                <div className={styles.errorMsg}>
                  <AlertCircle size={16} /> {modalError}
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className={styles.submitBtn}>Tạo Playlist</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
