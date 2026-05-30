import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Music, Users, Layers } from "lucide-react";

function Recommendation() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(42);
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

  // Search songs as user types
  useEffect(() => {
    const searchSongs = async () => {
      if (!songQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(`http://127.0.0.1:8000/songs/search?q=${encodeURIComponent(songQuery)}&limit=5`);
        const json = await res.json();
        if (json.status === "success" && json.data.length > 0) {
          setSearchResults(json.data);
        }
      } catch (err) {
        console.error("Search error:", err);
      }
    };

    const delayDebounce = setTimeout(() => {
      searchSongs();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [songQuery]);

  const selectSong = (song) => {
    setSongId(song.track_id);
    setSelectedSong(song);
    setSongQuery(song.track_name);
    setSearchResults([]);
  };

  const runAlgorithms = async () => {
    if (!userId) {
      setError("Please specify a User ID");
      return;
    }
    if (!songId) {
      setError("Please search and select a Song first");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // 1. Fetch Content-Based (CB)
      const cbRes = await fetch(`http://127.0.0.1:8000/recommend/content?song_id=${songId}&top_n=5`);
      const cbJson = await cbRes.json();
      
      // 2. Fetch Collaborative Filtering (CF)
      const cfRes = await fetch(`http://127.0.0.1:8000/recommend/cf?user_id=${userId}&top_n=5`);
      const cfJson = await cfRes.json();
      
      // 3. Fetch Hybrid
      const hyRes = await fetch(`http://127.0.0.1:8000/recommend?user_id=${userId}&song_id=${songId}&top_n=5`);
      const hyJson = await hyRes.json();

      if (cbJson.status === "success") setCbRecs(cbJson.data);
      if (cfJson.status === "success") setCfRecs(cfJson.data);
      if (hyJson.status === "success") setHybridRecs(hyJson.data);
    } catch (err) {
      setError("Error calling recommendation API: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Background decoration */}
      <div style={glowStyle1} />
      <div style={glowStyle2} />

      {/* Header */}
      <div style={headerStyle}>
        <button onClick={() => navigate("/home")} style={backBtnStyle}>
          <ArrowLeft size={18} /> Back to Music App
        </button>
        <h1 style={titleStyle}>🤖 Recommendation Sandbox & Algorithmic Benchmarking</h1>
        <p style={subtitleStyle}>Compare and diagnose SVD (Collaborative) and KNN (Content-Based) algorithms side-by-side.</p>
      </div>

      {/* Inputs Form */}
      <div style={formGridStyle}>
        {/* User Input */}
        <div style={inputCardStyle}>
          <div style={cardHeaderStyle}>
            <Users size={20} color="#7f9cf5" />
            <h3 style={cardTitleStyle}>1. Set User Profile (Collaborative SVD)</h3>
          </div>
          <p style={cardDescStyle}>Select an integer between 1 and 200 to load their personalized SVD profile.</p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="number"
              min="1"
              max="200"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={inputStyle}
            />
            <span style={{ color: "#a0aec0", fontSize: "14px" }}>Selected Profile: User {userId}</span>
          </div>
        </div>

        {/* Song Input */}
        <div style={inputCardStyle}>
          <div style={cardHeaderStyle}>
            <Music size={20} color="#34d399" />
            <h3 style={cardTitleStyle}>2. Choose Seed Song (Content-Based KNN)</h3>
          </div>
          <p style={cardDescStyle}>Search and pick a song to compute acoustic feature Cosine Similarity.</p>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Type track name (e.g. Atlantis, Seafret)..."
              value={songQuery}
              onChange={(e) => setSongQuery(e.target.value)}
              style={inputStyle}
            />
            {searchResults.length > 0 && (
              <div style={dropdownStyle}>
                {searchResults.map((song) => (
                  <div 
                    key={song.track_id} 
                    onClick={() => selectSong(song)}
                    style={dropdownItemStyle}
                  >
                    <strong>{song.track_name}</strong> - {song.artists} <span style={{ color: "#64748b" }}>({song.track_genre})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedSong && (
            <div style={selectedTagStyle}>
              📍 Selected: <strong>{selectedSong.track_name}</strong> by {selectedSong.artists} ({selectedSong.track_genre})
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div style={{ display: "flex", justifyContent: "center", margin: "30px 0" }}>
        <button onClick={runAlgorithms} disabled={loading} style={runBtnStyle}>
          {loading ? "Computing Latent Factors..." : "🔥 Generate Recommendations & Compare"}
        </button>
      </div>

      {error && <div style={errorStyle}>⚠️ {error}</div>}

      {/* Recommendations Side-by-Side Panel */}
      <div style={resultsGridStyle}>
        {/* CB Panel */}
        <div style={resultColStyle}>
          <div style={{ ...colHeaderStyle, borderBottom: "4px solid #34d399" }}>
            <Music size={20} color="#34d399" />
            <h4>Content-Based Filtering (KNN)</h4>
          </div>
          <p style={algoDescStyle}>Computes KNN Cosine Similarity on 7 normalized acoustic features (valence, energy, acousticness, etc.) with metadata boosts.</p>
          
          <div style={songListStyle}>
            {cbRecs.length === 0 ? (
              <div style={noDataStyle}>No results. Click generate above.</div>
            ) : (
              cbRecs.map((song, i) => (
                <div key={i} style={resultItemStyle}>
                  <div style={rankBadgeStyle}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={songNameStyle}>{song.track_name}</div>
                    <div style={songArtistStyle}>{song.artists}</div>
                  </div>
                  <span style={genreBadgeStyle}>{song.track_genre}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CF Panel */}
        <div style={resultColStyle}>
          <div style={{ ...colHeaderStyle, borderBottom: "4px solid #7f9cf5" }}>
            <Users size={20} color="#7f9cf5" />
            <h4>Collaborative Filtering (SVD)</h4>
          </div>
          <p style={algoDescStyle}>Uses low-rank Matrix Factorization trained with SGD to map users & items into 50 latent dimensions, predicting play count ratings.</p>
          
          <div style={songListStyle}>
            {cfRecs.length === 0 ? (
              <div style={noDataStyle}>No results. Click generate above.</div>
            ) : (
              cfRecs.map((song, i) => (
                <div key={i} style={resultItemStyle}>
                  <div style={rankBadgeStyle}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={songNameStyle}>{song.track_name}</div>
                    <div style={songArtistStyle}>{song.artists}</div>
                  </div>
                  <span style={genreBadgeStyle}>{song.track_genre}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Hybrid Panel */}
        <div style={resultColStyle}>
          <div style={{ ...colHeaderStyle, borderBottom: "4px solid #fbbf24" }}>
            <Layers size={20} color="#fbbf24" />
            <h4>Hybrid Fusion (CB + CF)</h4>
          </div>
          <p style={algoDescStyle}>Fuses collaborative user preference scores and content item similarities using Reciprocal Rank Fusion (RRF) for robust, cold-start safe suggestions.</p>
          
          <div style={songListStyle}>
            {hybridRecs.length === 0 ? (
              <div style={noDataStyle}>No results. Click generate above.</div>
            ) : (
              hybridRecs.map((song, i) => (
                <div key={i} style={{ ...resultItemStyle, background: "rgba(251, 191, 36, 0.05)" }}>
                  <div style={{ ...rankBadgeStyle, background: "#fbbf24", color: "#000" }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={songNameStyle}>{song.track_name}</div>
                    <div style={songArtistStyle}>{song.artists}</div>
                  </div>
                  <span style={genreBadgeStyle}>{song.track_genre}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// STYLES
const containerStyle = {
  minHeight: "100vh",
  background: "#060913",
  color: "#f8fafc",
  padding: "40px 5%",
  fontFamily: "'Outfit', sans-serif",
  position: "relative",
  overflow: "hidden"
};

const glowStyle1 = {
  position: "absolute",
  top: "-10%",
  left: "20%",
  width: "500px",
  height: "500px",
  background: "radial-gradient(circle, rgba(127,156,245,0.12) 0%, transparent 70%)",
  pointerEvents: "none"
};

const glowStyle2 = {
  position: "absolute",
  bottom: "10%",
  right: "10%",
  width: "600px",
  height: "600px",
  background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)",
  pointerEvents: "none"
};

const headerStyle = {
  marginBottom: "40px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  paddingBottom: "25px"
};

const backBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(255, 255, 255, 0.06)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  color: "#cbd5e1",
  padding: "8px 16px",
  borderRadius: "30px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  transition: "all 0.2s",
  marginBottom: "20px"
};

const titleStyle = {
  fontSize: "32px",
  fontWeight: "700",
  margin: "0 0 10px 0",
  background: "linear-gradient(135deg, #fff 0%, #a5b4fc 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent"
};

const subtitleStyle = {
  color: "#94a3b8",
  fontSize: "16px",
  margin: 0
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "25px",
  marginBottom: "10px"
};

const inputCardStyle = {
  background: "rgba(255, 255, 255, 0.02)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "16px",
  padding: "24px",
  backdropFilter: "blur(10px)"
};

const cardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px"
};

const cardTitleStyle = {
  fontSize: "18px",
  fontWeight: "600",
  margin: 0
};

const cardDescStyle = {
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 20px 0"
};

const inputStyle = {
  width: "100%",
  background: "rgba(0, 0, 0, 0.4)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: "10px",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box"
};

const dropdownStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  width: "100%",
  background: "#0b0f19",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  borderRadius: "10px",
  zIndex: 10,
  maxHeight: "220px",
  overflowY: "auto",
  marginTop: "5px"
};

const dropdownItemStyle = {
  padding: "12px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  cursor: "pointer",
  fontSize: "14px",
  transition: "background 0.2s"
};

const selectedTagStyle = {
  marginTop: "15px",
  background: "rgba(52, 211, 153, 0.08)",
  border: "1px solid rgba(52, 211, 153, 0.2)",
  padding: "10px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  color: "#34d399"
};

const runBtnStyle = {
  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
  color: "#fff",
  padding: "16px 36px",
  border: "none",
  borderRadius: "30px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)",
  transition: "transform 0.2s, box-shadow 0.2s"
};

const errorStyle = {
  background: "rgba(239, 68, 68, 0.1)",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  color: "#f87171",
  padding: "15px",
  borderRadius: "10px",
  maxWidth: "600px",
  margin: "0 auto 30px auto",
  textAlign: "center"
};

const resultsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "30px"
};

const resultColStyle = {
  background: "rgba(255, 255, 255, 0.01)",
  border: "1px solid rgba(255, 255, 255, 0.04)",
  borderRadius: "20px",
  padding: "24px",
  backdropFilter: "blur(10px)"
};

const colHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  paddingBottom: "15px",
  marginBottom: "15px"
};

const algoDescStyle = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: "1.6",
  marginBottom: "20px",
  minHeight: "60px"
};

const songListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const noDataStyle = {
  color: "#64748b",
  textAlign: "center",
  padding: "40px 0",
  fontSize: "14px",
  border: "1px dashed rgba(255, 255, 255, 0.1)",
  borderRadius: "12px"
};

const resultItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  padding: "14px 18px",
  background: "rgba(255, 255, 255, 0.02)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "12px",
  transition: "transform 0.2s"
};

const rankBadgeStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: "700"
};

const songNameStyle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#fff",
  marginBottom: "2px"
};

const songArtistStyle = {
  fontSize: "13px",
  color: "#94a3b8"
};

const genreBadgeStyle = {
  fontSize: "11px",
  color: "#a5b4fc",
  background: "rgba(165, 180, 252, 0.08)",
  padding: "4px 8px",
  borderRadius: "12px",
  border: "1px solid rgba(165, 180, 252, 0.15)"
};

export default Recommendation;