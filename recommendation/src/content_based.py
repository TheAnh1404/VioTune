import os
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity

# ===== LOAD DATA =====
current_dir = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(current_dir, "../data/dataset.csv")

songs = pd.read_csv(data_path)

# ===== FEATURES =====
features = [
    "danceability",
    "energy",
    "acousticness",
    "instrumentalness",
    "liveness",
    "valence",
    "tempo"
]

# ===== CLEAN DATA =====
songs = songs.dropna(subset=features + ["track_id", "track_genre"])
songs = songs.reset_index(drop=True)

# ===== NORMALIZE =====
scaler = MinMaxScaler()
scaled_features = scaler.fit_transform(songs[features])

# ===== RECOMMEND FUNCTION =====
def recommend(song_id, top_n=5):
    # Tìm index
    idx_list = songs[songs["track_id"] == song_id].index
    if len(idx_list) == 0:
        return "Không tìm thấy bài hát này."
    
    idx = idx_list[0]

    # Lấy feature của bài hát
    song_feature = scaled_features[idx].reshape(1, -1)

    # Tính similarity
    sim_scores = cosine_similarity(song_feature, scaled_features).flatten()

    # ===== BOOST GENRE =====
    target_genre = songs.iloc[idx]["track_genre"]
    genre_mask = (songs["track_genre"] == target_genre).astype(int)

    # tăng trọng số cho cùng genre
    sim_scores = sim_scores + 0.1 * genre_mask

    # ===== REMOVE ITSELF =====
    sim_scores[idx] = -1  # đảm bảo không bao giờ chọn chính nó

    # ===== TOP N =====
    top_indices = sim_scores.argsort()[-top_n:][::-1]

    return songs.iloc[top_indices][["track_name", "artists", "track_genre"]]