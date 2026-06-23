import os
import sys
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import NearestNeighbors

# Configure UTF-8 encoding for Windows terminals to prevent UnicodeEncodeError
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# ===== LOAD DATA =====
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "../data/viotune.db")

# Add parent directory to sys.path to allow importing api.firebase_db
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)
try:
    import api.firebase_db as fdb
except Exception as e:
    print(f"[CB] Error importing api.firebase_db: {e}")
    fdb = None

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

# Build a fast O(1) lookup index from track_id to dataframe index
track_id_to_idx = {tid: idx for idx, tid in enumerate(songs["track_id"])}

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

# Path to pre-built index
models_dir = os.path.join(current_dir, "../models")
index_path = os.path.join(models_dir, "content_index.ann")

try:
    import importlib.util as _ilu
    _annoy_found = _ilu.find_spec("annoy") is not None
except Exception:
    _annoy_found = False

use_annoy = False
annoy_index = None
nn_model = None

if _annoy_found:
    try:
        from annoy import AnnoyIndex  # type: ignore[import-untyped]
        # 7 features, using angular distance which maps to Cosine distance
        annoy_index = AnnoyIndex(7, 'angular')

        if os.path.exists(index_path):
            print(f"[CB] Loading Annoy Index from {index_path}...")
            annoy_index.load(index_path)
            use_annoy = True
            print("[CB] Annoy approximate nearest neighbors index loaded successfully.")
        else:
            print(f"[CB] Annoy Index not found at {index_path}. Building in-memory index...")
            for i, vec in enumerate(scaled_features):
                annoy_index.add_item(i, vec)
            annoy_index.build(15)
            use_annoy = True
            print("[CB] In-memory Annoy index built successfully.")
    except Exception:
        _annoy_found = False

if not _annoy_found:
    print("[CB] Annoy package not found, falling back to Scikit-learn NearestNeighbors (brute cosine).")
    from sklearn.neighbors import NearestNeighbors
    nn_model = NearestNeighbors(n_neighbors=N_NEIGHBORS_TO_SEARCH, metric='cosine', algorithm='brute')
    nn_model.fit(scaled_features)

# Helper to extract user preferences from Firestore for Dynamic Profile Matching
def get_user_preferences(user_id):
    if not user_id or fdb is None:
        return {}, {}
    user_id_str = str(user_id)
    track_ids = []
    
    # 1. Lấy bài hát đã thích
    try:
        likes = fdb.query_documents("liked_songs", {"user_id": user_id_str})
        for l in likes:
            tid = l.get("track_id")
            if tid:
                track_ids.append(tid)
    except Exception as e:
        print(f"[CB] Error fetching likes for taste profile: {e}")
        
    # 2. Lấy lịch sử phát nhạc
    try:
        history = fdb.query_documents("play_history", {"user_id": user_id_str})
        for h in history:
            tid = h.get("track_id")
            if tid:
                track_ids.append(tid)
    except Exception as e:
        print(f"[CB] Error fetching history for taste profile: {e}")
        
    if not track_ids:
        return {}, {}
        
    # Thống kê thể loại và nghệ sĩ yêu thích
    user_genres = []
    user_artists = []
    for tid in track_ids:
        if tid in track_id_to_idx:
            idx = track_id_to_idx[tid]
            row = songs.iloc[idx]
            genre = row["track_genre"]
            if pd.notna(genre):
                user_genres.append(genre)
            art_str = row["artists"]
            if pd.notna(art_str):
                user_artists.extend(str(art_str).split(";"))
                
    if not user_genres and not user_artists:
        return {}, {}
        
    # Tỷ lệ xuất hiện của các thể loại
    genre_ratios = {}
    if user_genres:
        genre_counts = pd.Series(user_genres).value_counts()
        genre_ratios = (genre_counts / len(user_genres)).to_dict()
        
    # Tỷ lệ xuất hiện của các nghệ sĩ
    artist_ratios = {}
    if user_artists:
        artist_counts = pd.Series(user_artists).value_counts()
        artist_ratios = (artist_counts / len(user_artists)).to_dict()
        
    return genre_ratios, artist_ratios

# ===== RECOMMEND FUNCTION =====
def recommend(song_id, top_n=5, user_id=None, discovery_mode=False):
    return recommend_multi([song_id], top_n, user_id=user_id, discovery_mode=discovery_mode)

def recommend_multi(song_ids, top_n=5, user_id=None, discovery_mode=False):
    if not song_ids:
        return "Danh sách hạt giống trống."
    
    # 1. Tìm các bài hát hạt giống và tính vector trung bình
    valid_indices = [track_id_to_idx[sid] for sid in song_ids if sid in track_id_to_idx]
            
    if not valid_indices:
        return "Không tìm thấy bất kỳ bài hát hạt giống nào."
    
    # Lấy sở thích của người dùng để thực hiện Dynamic Profile Matching
    genre_ratios, artist_ratios = get_user_preferences(user_id)
    
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
    
    # Pre-extract numpy arrays to avoid iloc overhead in the loop
    neighbor_songs = songs.iloc[neighbor_indices]
    neighbor_ids = neighbor_songs["track_id"].values
    neighbor_genres = neighbor_songs["track_genre"].values
    neighbor_artists_list = neighbor_songs["artists"].values
    neighbor_popularities = neighbor_songs["popularity"].values
    
    for i in range(len(neighbor_indices)):
        tid = neighbor_ids[i]
        if tid in seed_ids_set:
            final_scores[i] = -1.0 # Bỏ qua các bài hạt giống
            continue
            
        score = 1.0 - distances[i]
        
        # Boost 1: Thể loại (Genre Match + Dynamic Profile Matching)
        genre_boost = 0.0
        if neighbor_genres[i] in target_genres:
            genre_boost += 0.03
        
        # Dynamic Profile Matching cho thể loại
        if genre_ratios and neighbor_genres[i] in genre_ratios:
            genre_boost += 0.05 * genre_ratios[neighbor_genres[i]]
        score += genre_boost
            
        # Boost 2: Nghệ sĩ (Artist Match + Dynamic Profile Matching)
        artist_boost = 0.0
        neighbor_arts = set(str(neighbor_artists_list[i]).split(";"))
        if target_artists.intersection(neighbor_arts):
            artist_boost += 0.04
            
        # Dynamic Profile Matching cho nghệ sĩ
        if artist_ratios:
            shared_artists = neighbor_arts.intersection(artist_ratios.keys())
            if shared_artists:
                artist_pref = max(artist_ratios[art] for art in shared_artists)
                artist_boost += 0.06 * artist_pref
        score += artist_boost
            
        # Boost 3: Độ phủ sóng (Popularity Boost / Inverse Popularity Discounting)
        if discovery_mode:
            # Discovery Mode: Phạt bài phổ biến / Khuyến khích bài ít phổ biến (nghịch đảo)
            pop_boost = ((100.0 - neighbor_popularities[i]) / 100.0) * 0.05
        else:
            # Normal Mode: Khuyến khích nhẹ bài hát phổ biến
            pop_boost = (neighbor_popularities[i] / 100.0) * 0.03
        score += pop_boost
        
        final_scores[i] = score

    # 4. Trả về Top N
    sorted_relative_idx = final_scores.argsort()[-top_n:][::-1]
    best_candidate_idx = neighbor_indices[sorted_relative_idx]

    return songs.iloc[best_candidate_idx][["track_id", "track_name", "artists", "track_genre", "popularity"]]