import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import NearestNeighbors

# ===== LOAD DATA =====
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "../data/viotune.db")

try:
    import sqlite3
    conn = sqlite3.connect(db_path)
    songs = pd.read_sql("SELECT * FROM songs", conn)
    conn.close()
except Exception as e:
    print(f"[CB] Error loading dataset from SQLite: {e}")
    # Fallback to CSV
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
# Loại bỏ dòng thiếu dữ liệu ở các cột thiết yếu
songs = songs.dropna(subset=features + ["track_id", "track_genre", "popularity", "artists"])
songs = songs.reset_index(drop=True)

# ===== NORMALIZE & WEIGHTING =====
scaler = MinMaxScaler()
scaled_features = scaler.fit_transform(songs[features])

# Trọng số đặc trưng (Feature Weights):
# Tăng cường vai trò của nhịp điệu (danceability) và cảm xúc (valence/energy)
# Giảm vai trò của liveness và instrumentalness (dễ gây nhiễu nếu thiếu hụt)
weights = np.array([1.2, 1.1, 0.9, 0.7, 0.6, 1.2, 1.0])
scaled_features = scaled_features * weights

# ===== K-NEAREST NEIGHBORS (KNN) VÀ SPOTIFY ANNOY INDEX =====
N_NEIGHBORS_TO_SEARCH = 1000
use_annoy = False
annoy_index = None
nn_model = None

try:
    from annoy import AnnoyIndex
    # 7 features, using angular distance which maps to Cosine distance
    annoy_index = AnnoyIndex(7, 'angular')
    for i, vec in enumerate(scaled_features):
        annoy_index.add_item(i, vec)
    annoy_index.build(15) # Build 15 trees for high accuracy log-time search
    use_annoy = True
    print("[CB] Spotify Annoy approximate nearest neighbors index built successfully.")
except ImportError:
    print("[CB] Annoy package not found, falling back to Scikit-learn NearestNeighbors (brute cosine).")
    nn_model = NearestNeighbors(n_neighbors=N_NEIGHBORS_TO_SEARCH, metric='cosine', algorithm='brute')
    nn_model.fit(scaled_features)

# ===== RECOMMEND FUNCTION =====
def recommend(song_id, top_n=5):
    # 1. Tìm bài hát gốc
    idx_list = songs[songs["track_id"] == song_id].index
    if len(idx_list) == 0:
        return "Không tìm thấy bài hát này."
    
    idx = idx_list[0]
    song_feature = scaled_features[idx].reshape(1, -1)

    # 2. Tìm láng giềng gần nhất dựa trên âm thanh (Audio Features)
    if use_annoy:
        # Annoy returns (indices, angular_distances)
        # Angular distance in Annoy is d = sqrt(2 * (1 - cosine_similarity))
        # Therefore, cosine_distance = d^2 / 2
        indices, angular_distances = annoy_index.get_nns_by_vector(song_feature.flatten(), N_NEIGHBORS_TO_SEARCH, include_distances=True)
        neighbor_indices = np.array(indices)
        distances = np.array([float(d)**2 / 2.0 for d in angular_distances])
    else:
        # Scikit-learn brute-force NearestNeighbors fallback
        distances, indices = nn_model.kneighbors(song_feature)
        distances = distances.flatten()
        neighbor_indices = indices.flatten()
    
    # 3. Chấm điểm kết hợp (Metadata Scoring/Reranking)
    target_genre = songs.iloc[idx]["track_genre"]
    target_artists = set(str(songs.iloc[idx]["artists"]).split(";"))
    
    final_scores = np.zeros(len(neighbor_indices))
    
    for i, n_idx in enumerate(neighbor_indices):
        if n_idx == idx:
            final_scores[i] = -1.0 # Bỏ qua bài đang xét
            continue
            
        # Cosine Similarity = 1 - Cosine Distance
        score = 1.0 - distances[i]
        
        neighbor_song = songs.iloc[n_idx]
        
        # Boost 1: Khớp thể loại (+0.1)
        if neighbor_song["track_genre"] == target_genre:
            score += 0.1
            
        # Boost 2: Khớp nghệ sĩ (+0.15)
        neighbor_artists = set(str(neighbor_song["artists"]).split(";"))
        if target_artists.intersection(neighbor_artists):
            score += 0.15
            
        # Boost 3: Độ phủ sóng (+0.05 max)
        # Giúp ưu tiên các bài hát nổi tiếng nếu 2 bài nghe giống hệt nhau
        pop_boost = (neighbor_song["popularity"] / 100.0) * 0.05
        score += pop_boost
        
        final_scores[i] = score

    # 4. Trả về Top N
    # argsort sắp xếp từ thấp lên cao -> dùng [-top_n:] để lấy n max -> [::-1] để đảo chiều
    sorted_relative_idx = final_scores.argsort()[-top_n:][::-1]
    best_candidate_idx = neighbor_indices[sorted_relative_idx]

    return songs.iloc[best_candidate_idx][["track_name", "artists", "track_genre", "popularity"]]