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
    return recommend_multi([song_id], top_n)

def recommend_multi(song_ids, top_n=5):
    if not song_ids:
        return "Danh sách hạt giống trống."
    
    # 1. Tìm các bài hát hạt giống và tính vector trung bình
    valid_indices = []
    for sid in song_ids:
        idx_list = songs[songs["track_id"] == sid].index
        if len(idx_list) > 0:
            valid_indices.append(idx_list[0])
            
    if not valid_indices:
        return "Không tìm thấy bất kỳ bài hát hạt giống nào."
    
    # Lấy vector đặc trưng của các bài hạt giống và tính trung bình
    seed_features = scaled_features[valid_indices]
    mean_feature = np.mean(seed_features, axis=0).reshape(1, -1)

    # 2. Tìm láng giềng gần nhất dựa trên trung bình đặc trưng
    if use_annoy:
        indices, angular_distances = annoy_index.get_nns_by_vector(mean_feature.flatten(), N_NEIGHBORS_TO_SEARCH, include_distances=True)
        neighbor_indices = np.array(indices)
        distances = np.array([float(d)**2 / 2.0 for d in angular_distances])
    else:
        distances, indices = nn_model.kneighbors(mean_feature)
        distances = distances.flatten()
        neighbor_indices = indices.flatten()
    
    # 3. Chấm điểm kết hợp (Metadata Scoring/Reranking)
    # Lấy genres và artists của tất cả hạt giống để boost
    target_genres = set(songs.iloc[valid_indices]["track_genre"])
    target_artists = set()
    for art_str in songs.iloc[valid_indices]["artists"]:
        target_artists.update(str(art_str).split(";"))
    
    final_scores = np.zeros(len(neighbor_indices))
    seed_ids_set = set(song_ids)
    
    for i, n_idx in enumerate(neighbor_indices):
        neighbor_song = songs.iloc[n_idx]
        if neighbor_song["track_id"] in seed_ids_set:
            final_scores[i] = -1.0 # Bỏ qua các bài hạt giống
            continue
            
        score = 1.0 - distances[i]
        
        # Boost 1: Khớp thể loại (+0.1)
        if neighbor_song["track_genre"] in target_genres:
            score += 0.1
            
        # Boost 2: Khớp nghệ sĩ (+0.15)
        neighbor_artists = set(str(neighbor_song["artists"]).split(";"))
        if target_artists.intersection(neighbor_artists):
            score += 0.15
            
        # Boost 3: Độ phủ sóng (+0.05 max)
        pop_boost = (neighbor_song["popularity"] / 100.0) * 0.05
        score += pop_boost
        
        final_scores[i] = score

    # 4. Trả về Top N
    sorted_relative_idx = final_scores.argsort()[-top_n:][::-1]
    best_candidate_idx = neighbor_indices[sorted_relative_idx]

    return songs.iloc[best_candidate_idx][["track_id", "track_name", "artists", "track_genre", "popularity"]]