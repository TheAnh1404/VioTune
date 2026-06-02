import React, { useState, useEffect } from 'react';
import styles from './AIRecommendationStation.module.css';
import { Sliders, Activity, Cpu, Search, Music, Layers, Sparkles, RefreshCw, Heart } from 'lucide-react';
import { API_URL } from '../../config';

const getCoverImage = (trackId) => {
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

const AIRecommendationStation = ({ userId, currentSong, onPlaySong, likedSongIds, onLikeSong, likedTrigger }) => {
  const [alpha, setAlpha] = useState(0.5);
  const [seedSong, setSeedSong] = useState(null);
  const [recs, setRecs] = useState([]);
  const [taste, setTaste] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  
  // Search state for custom seed
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Retrain state
  const [retrainStatus, setRetrainStatus] = useState("");
  const [retrainLoading, setRetrainLoading] = useState(false);

  // 1. Sync seed song with current playing song if user changes it
  useEffect(() => {
    if (currentSong) {
      setSeedSong(currentSong);
      setSearchQuery(currentSong.track_name);
    } else if (!seedSong) {
      // Fallback: fetch a random high popularity song as default seed
      const fetchDefaultSeed = async () => {
        try {
          const res = await fetch(`${API_URL}/songs/random?limit=1`);
          const json = await res.json();
          if (json.status === "success" && json.data.length > 0) {
            setSeedSong(json.data[0]);
            setSearchQuery(json.data[0].track_name);
          }
        } catch (err) {
          console.error("Failed to load default seed:", err);
        }
      };
      fetchDefaultSeed();
    }
  }, [currentSong]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // 2. Fetch User Taste Profile when likedTrigger changes
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
  }, [userId, likedTrigger]);

  // 3. Search seeds on type
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/songs/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
        const json = await res.json();
        if (json.status === "success") {
          setSearchResults(json.data);
        }
      } catch (err) {
        console.error("Search seed failed:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // 4. Fetch recommendations when alpha or seedSong changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId || !seedSong) return;
      setLoadingRecs(true);
      try {
        const res = await fetch(`${API_URL}/recommend?user_id=${userId}&song_id=${seedSong.track_id}&alpha=${alpha}&top_n=6`);
        const json = await res.json();
        if (json.status === "success") {
          // Convert from hybrid output {track_name, artists, track_genre} 
          // to include cover, track_id by finding match in songs search if possible, or build cover url
          const tracks = json.data.map(track => {
            // Check if track has a unique ID, or build deterministic hash-id
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

  const selectSeed = (song) => {
    setSeedSong(song);
    setSearchQuery(song.track_name);
    setShowSearchDropdown(false);
  };

  const handleRetrain = async () => {
    setRetrainLoading(true);
    setRetrainStatus("Initiating SVD Stochastic Gradient Descent (SGD)...");
    try {
      const res = await fetch(`${API_URL}/recommend/retrain`, { method: 'POST' });
      const json = await res.json();
      if (json.status === "success") {
        setRetrainStatus("SVD retrained in background. Real-time fold-in updated.");
        // Clear status after 4 seconds
        setTimeout(() => setRetrainStatus(""), 4000);
      }
    } catch (err) {
      setRetrainStatus("Error triggering retrain: " + err.message);
    } finally {
      setRetrainLoading(false);
    }
  };

  const getAlphaLabel = () => {
    if (alpha === 0) return "100% SVD Collaborative Filtering";
    if (alpha === 1) return "100% KNN Content-Based";
    if (alpha === 0.5) return "Balanced Hybrid Fusion (50% / 50%)";
    return `Hybrid Fusion (CB: ${(alpha * 100).toFixed(0)}% | CF: ${((1 - alpha) * 100).toFixed(0)}%)`;
  };

  return (
    <div className={styles.stationContainer}>
      <div className={styles.glowingBorder} />
      
      {/* Title Header */}
      <div className={styles.header}>
        <div className={styles.sparkleIcon}>
          <Sparkles size={22} className={styles.iconSparks} />
        </div>
        <div>
          <h2 className={styles.title}>VioTune AI Recommendation Station</h2>
          <p className={styles.subtitle}>Fine-tune matching latent factors and analyze your acoustic DNA profile in real-time.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Left Column: Gu Âm Nhạc / Taste Profile & Retrain */}
        <div className={styles.leftCol}>
          <div className={styles.cardHeader}>
            <Activity size={18} color="#06b6d4" />
            <h3>Your Acoustic DNA Profile</h3>
          </div>
          <p className={styles.cardDesc}>
            Acoustic indices analyzed from your liked tracks. Your SVD preference vector is projected in real-time using **Fold-in Projection**.
          </p>

          {taste ? (
            <div className={styles.statsWrapper}>
              <div className={styles.genreBanner}>
                Favorite Genre: <span>{taste.favorite_genre}</span> ({taste.song_count} songs liked)
              </div>

              {/* Progress bars */}
              <div className={styles.metricRow}>
                <div className={styles.metricLabel}>
                  <span>Danceability (Nhịp điệu)</span>
                  <span>{(taste.danceability * 100).toFixed(0)}%</span>
                </div>
                <div className={styles.metricBarTrack}>
                  <div className={styles.metricBarFill} style={{ width: `${taste.danceability * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)' }} />
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricLabel}>
                  <span>Energy (Năng lượng)</span>
                  <span>{(taste.energy * 100).toFixed(0)}%</span>
                </div>
                <div className={styles.metricBarTrack}>
                  <div className={styles.metricBarFill} style={{ width: `${taste.energy * 100}%`, background: 'linear-gradient(90deg, #ec4899, #8b5cf6)' }} />
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricLabel}>
                  <span>Valence (Cảm xúc tích cực)</span>
                  <span>{(taste.valence * 100).toFixed(0)}%</span>
                </div>
                <div className={styles.metricBarTrack}>
                  <div className={styles.metricBarFill} style={{ width: `${taste.valence * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #ec4899)' }} />
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricLabel}>
                  <span>Acousticness (Độ mộc mạc)</span>
                  <span>{(taste.acousticness * 100).toFixed(0)}%</span>
                </div>
                <div className={styles.metricBarTrack}>
                  <div className={styles.metricBarFill} style={{ width: `${taste.acousticness * 100}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricLabel}>
                  <span>Instrumentalness (Nhạc cụ)</span>
                  <span>{(taste.instrumentalness * 100).toFixed(0)}%</span>
                </div>
                <div className={styles.metricBarTrack}>
                  <div className={styles.metricBarFill} style={{ width: `${taste.instrumentalness * 100}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.loadingPlaceholder}>Analyzing DNA Profile...</div>
          )}

          {/* Model Health / Retrain Widget */}
          <div className={styles.retrainBox}>
            <div className={styles.retrainHeader}>
              <Cpu size={16} color="#8b5cf6" />
              <span>SVD Latent Factors: 50 Dimensions</span>
            </div>
            <p>Triggers full matrix factorization training to fuse offline collaborative weights with new active profiles.</p>
            <button className={styles.retrainBtn} onClick={handleRetrain} disabled={retrainLoading}>
              <RefreshCw size={14} className={retrainLoading ? styles.spinning : ''} />
              {retrainLoading ? "SGD Matrix Training..." : "Retrain SVD Latent Model"}
            </button>
            {retrainStatus && <div className={styles.retrainStatus}>{retrainStatus}</div>}
          </div>
        </div>

        {/* Right Column: Dynamic Tuning & Recs */}
        <div className={styles.rightCol}>
          <div className={styles.tunerControls}>
            <div className={styles.cardHeader}>
              <Sliders size={18} color="#8b5cf6" />
              <h3>Hybrid Fusion Tuner</h3>
            </div>

            {/* Seed song selector */}
            <div className={styles.seedSelectorGroup}>
              <label>Content-Based Seed Song:</label>
              <div className={styles.searchWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="Search seed song for KNN Cosine..."
                />
                
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className={styles.searchDropdown}>
                    {searchResults.map((song) => (
                      <div key={song.track_id} className={styles.dropdownItem} onClick={() => selectSeed(song)}>
                        <Music size={14} style={{ marginRight: '8px', color: '#06b6d4' }} />
                        <div className={styles.dropdownText}>
                          <span className={styles.dropdownTitle}>{song.track_name}</span>
                          <span className={styles.dropdownArtist}>{song.artists}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {seedSong && (
                <div className={styles.selectedSeedTag}>
                  🌱 Seed: <strong>{seedSong.track_name}</strong> - {seedSong.artists} <span className={styles.genreBadge}>{seedSong.track_genre}</span>
                </div>
              )}
            </div>

            {/* Range slider */}
            <div className={styles.sliderGroup}>
              <div className={styles.sliderLabelRow}>
                <span>Collaborative SVD</span>
                <span className={styles.alphaValue}>{(alpha).toFixed(2)}</span>
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
              <div className={styles.currentAlphaFormula}>
                <Layers size={14} style={{ marginRight: '6px' }} />
                <span>{getAlphaLabel()}</span>
              </div>
            </div>
          </div>

          {/* Dynamic generated list */}
          <div className={styles.recsListWrapper}>
            <div className={styles.recsHeader}>
              <h4>Dynamic Generated Playlist ({recs.length})</h4>
              {loadingRecs && <span className={styles.loadingSpinner}>⟳</span>}
            </div>

            {recs.length === 0 ? (
              <div className={styles.noData}>Select a seed and slide the tuner to generate tracks.</div>
            ) : (
              <div className={styles.recsGrid}>
                {recs.map((song, idx) => {
                  const isLiked = likedSongIds.has(song.track_id);
                  return (
                    <div key={song.track_id + '-' + idx} className={styles.recCard} onClick={() => onPlaySong && onPlaySong(song, recs)}>
                      <img src={song.cover_url} alt={song.track_name} className={styles.recCover} />
                      <div className={styles.recInfo}>
                        <h5>{song.track_name}</h5>
                        <span>{song.artists}</span>
                        <span className={styles.recGenre}>{song.track_genre}</span>
                      </div>
                      <div className={styles.badgeRank}>{idx + 1}</div>
                      <button 
                        className={`${styles.likeBtn} ${isLiked ? styles.liked : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onLikeSong && onLikeSong(song);
                        }}
                      >
                        <Heart size={14} fill={isLiked ? "#ef4444" : "transparent"} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendationStation;
