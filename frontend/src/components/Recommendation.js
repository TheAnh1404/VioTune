import React, { useState } from "react";

function Recommendation() {
  const [userId, setUserId] = useState(1);
  const [songId, setSongId] = useState("");
  const [results, setResults] = useState([]);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/recommend?user_id=${userId}&song_id=${songId}`
      );

      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Lỗi gọi API:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🎧 Music Recommendation</h2>

      <input
        type="number"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />

      <input
        type="text"
        placeholder="Song ID"
        value={songId}
        onChange={(e) => setSongId(e.target.value)}
      />

      <button onClick={fetchRecommendations}>
        Recommend
      </button>

      <ul>
        {results.map((song, index) => (
          <li key={index}>
            <strong>{song.track_name}</strong> - {song.artists} ({song.track_genre})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Recommendation;