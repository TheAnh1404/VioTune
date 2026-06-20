import os
import sys

# Configure UTF-8 encoding for Windows terminals to prevent UnicodeEncodeError
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from dotenv import load_dotenv

# Load environment variables
current_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(current_dir, "../.env"))

# Add parent directory to sys.path to allow importing api.firebase_db
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)
import api.firebase_db as fdb

db_path = os.path.join(current_dir, "../data/viotune.db")
songs_path = os.path.join(current_dir, "../data/dataset.csv")
interactions_path = os.path.join(current_dir, "../data/interactions.csv")
models_dir = os.path.join(current_dir, "../models")
os.makedirs(models_dir, exist_ok=True)

# ===== LOAD DỮ LIỆU =====
try:
    import sqlite3
    conn = sqlite3.connect(db_path)
    songs = pd.read_sql("SELECT * FROM songs", conn)
    conn.close()
except Exception as e:
    print(f"[CF] Error loading dataset from SQLite: {e}")
    songs = pd.read_csv(songs_path)

interactions = pd.read_csv(interactions_path)

# ===== TIỀN XỬ LÝ =====
# Áp dụng Log Normalization để cân bằng play_count
# Người nghe 1 lần vs 100 lần sẽ không bị chênh lệch quá lớn
interactions["rating"] = np.log1p(interactions["play_count"])

# Chuyển user_id và track_id thành index số nguyên nội bộ
user_ids = interactions["user_id"].unique()
track_ids = interactions["track_id"].unique()

user_index = {uid: i for i, uid in enumerate(user_ids)}
track_index = {tid: i for i, tid in enumerate(track_ids)}
index_to_track = {i: tid for tid, i in track_index.items()}

interactions["u_idx"] = interactions["user_id"].map(user_index)
interactions["i_idx"] = interactions["track_id"].map(track_index)

n_users = len(user_ids)
n_items = len(track_ids)

# ===== CHIA TRAIN / TEST (80/20) =====
train_data, test_data = train_test_split(interactions, test_size=0.2, random_state=42)

print(f"[CF] Dataset: {n_users} users | {n_items} items")
print(f"[CF] Training: {len(train_data)} | Testing: {len(test_data)}")


# =============================================================
# CLASS SVD MODEL — MATRIX FACTORIZATION VỚI SGD THUẦN NUMPY
# =============================================================
class SVDModel:
    """
    Matrix Factorization với Stochastic Gradient Descent (SGD).

    Công thức dự đoán (Bias Model):
        r̂_ui = μ + b_u + b_i + Q[i] · P[u]

    Hàm mất mát (Regularized MSE):
        Loss = Σ (r_ui - r̂_ui)² + λ(||Q[i]||² + ||P[u]||² + b_u² + b_i²)
    """

    def __init__(self, n_users, n_items, k=50, lr=0.005, reg=0.02, n_epochs=30):
        """
        n_users: Số lượng người dùng
        n_items: Số lượng bài hát
        k:       Số chiều ẩn (Latent Factors)
        lr:      Tốc độ học γ (Learning Rate)
        reg:     Hệ số điều chuẩn λ (Regularization)
        n_epochs: Số vòng lặp huấn luyện
        """
        self.k = k
        self.lr = lr
        self.reg = reg
        self.n_epochs = n_epochs

        # ===== BƯỚC 2: KHỞI TẠO MA TRẬN P, Q VÀ BIAS =====
        # Khởi tạo nhỏ với Gaussian noise để tránh điểm đối xứng
        self.P = np.random.normal(0, 0.01, (n_users, k))   # Ma trận User  (m × k)
        self.Q = np.random.normal(0, 0.01, (n_items, k))   # Ma trận Item  (n × k)
        self.b_u = np.zeros(n_users)                        # Bias người dùng
        self.b_i = np.zeros(n_items)                        # Bias bài hát
        self.mu = 0.0                                       # Trung bình toàn cục

    def _predict(self, u, i):
        """Dự đoán r̂_ui cho một cặp (user, item)."""
        return self.mu + self.b_u[u] + self.b_i[i] + self.Q[i].dot(self.P[u])

    def _rmse(self, data):
        """Tính RMSE trên một tập dữ liệu."""
        errors = []
        for _, row in data.iterrows():
            u, i, r = int(row["u_idx"]), int(row["i_idx"]), row["rating"]
            pred = self._predict(u, i)
            errors.append((r - pred) ** 2)
        return np.sqrt(np.mean(errors))

    def fit(self, train_data, test_data=None):
        """
        BƯỚC 4: HUẤN LUYỆN MÔ HÌNH BẰNG SGD.
        Mỗi epoch duyệt ngẫu nhiên từng cặp (u, i, r_ui).
        """
        # Tính trung bình toàn cục μ từ tập train
        self.mu = train_data["rating"].mean()

        train_records = train_data[["u_idx", "i_idx", "rating"]].values

        for epoch in range(1, self.n_epochs + 1):
            # Xáo trộn dữ liệu mỗi epoch (Stochastic)
            np.random.shuffle(train_records)

            for u, i, r in train_records:
                u, i = int(u), int(i)

                # Tính sai số: e_ui = r_ui - r̂_ui
                pred = self._predict(u, i)
                e = r - pred

                # ===== CẬP NHẬT BIAS =====
                self.b_u[u] += self.lr * (e - self.reg * self.b_u[u])
                self.b_i[i] += self.lr * (e - self.reg * self.b_i[i])

                # ===== CẬP NHẬT MA TRẬN P VÀ Q =====
                # Lưu tạm P[u] trước khi cập nhật để dùng cho Q[i]
                p_u_old = self.P[u].copy()

                self.P[u] += self.lr * (e * self.Q[i] - self.reg * self.P[u])
                self.Q[i] += self.lr * (e * p_u_old - self.reg * self.Q[i])

            # In RMSE sau mỗi 5 epochs để theo dõi quá trình học
            if epoch % 5 == 0 or epoch == 1:
                train_rmse = self._rmse(train_data)
                log_msg = f"  Epoch {epoch:3d}/{self.n_epochs} | Train RMSE: {train_rmse:.4f}"
                if test_data is not None:
                    test_rmse = self._rmse(test_data)
                    log_msg += f" | Test RMSE: {test_rmse:.4f}"
                print(log_msg)

        print("[CF] Huấn luyện hoàn tất!")
        return self

    def predict_for_user(self, u_idx, listened_item_indices):
        """
        BƯỚC 6: DỰ ĐOÁN ĐIỂM CHO TẤT CẢ BÀI CHƯA NGHE,
        trả về danh sách (item_idx, score) đã sắp xếp giảm dần.
        Vectorized numpy implementation.
        """
        scores = self.mu + self.b_u[u_idx] + self.b_i + self.Q.dot(self.P[u_idx])
        if listened_item_indices:
            # Chuyển listened_item_indices thành list số nguyên để NumPy indexing hợp lệ
            idx_list = [int(x) for x in listened_item_indices if int(x) < len(scores)]
            if idx_list:
                scores[idx_list] = -np.inf
                
        sorted_indices = np.argsort(scores)[::-1]
        results = []
        for idx in sorted_indices:
            score = scores[idx]
            if score == -np.inf:
                break
            results.append((idx, score))
        return results

    def compute_user_latent_vector(self, user_ratings, n_iterations=30):
        """
        [Fold-in Projection] Tính toán vector biểu diễn ẩn P_u và bias b_u cho người dùng thời gian thực
        dựa trên lịch sử tương tác cá nhân (listened/likes) và ma trận bài hát ẩn Q của mô hình.
        Phương pháp tối ưu hóa bằng Stochastic Gradient Descent (SGD) trên duy nhất tập dữ liệu người dùng.
        """
        p_u = np.zeros(self.k)
        b_u = 0.0
        
        for _ in range(n_iterations):
            for i_idx, r in user_ratings:
                pred = self.mu + b_u + self.b_i[i_idx] + self.Q[i_idx].dot(p_u)
                e = r - pred
                
                # Cập nhật bias và latent factors cho người dùng đơn lẻ
                b_u += self.lr * (e - self.reg * b_u)
                p_u += self.lr * (e * self.Q[i_idx] - self.reg * p_u)
                
        return p_u, b_u

    def predict_for_user_vector(self, p_u, b_u, listened_item_indices):
        """
        Dự đoán điểm số cho toàn bộ bài hát chưa nghe dựa trên vector latent p_u và bias b_u
        được chiếu (projected) thời gian thực của người dùng.
        Vectorized numpy implementation.
        """
        scores = self.mu + b_u + self.b_i + self.Q.dot(p_u)
        if listened_item_indices:
            idx_list = [int(x) for x in listened_item_indices if int(x) < len(scores)]
            if idx_list:
                scores[idx_list] = -np.inf
                
        sorted_indices = np.argsort(scores)[::-1]
        results = []
        for idx in sorted_indices:
            score = scores[idx]
            if score == -np.inf:
                break
            results.append((idx, score))
        return results

    def save(self, save_dir):
        """Lưu ma trận P, Q và bias vào thư mục models/."""
        np.save(os.path.join(save_dir, "P.npy"), self.P)
        np.save(os.path.join(save_dir, "Q.npy"), self.Q)
        np.save(os.path.join(save_dir, "b_u.npy"), self.b_u)
        np.save(os.path.join(save_dir, "b_i.npy"), self.b_i)
        np.save(os.path.join(save_dir, "mu.npy"), np.array([self.mu]))
        print(f"[CF] Đã lưu model tại: {save_dir}")

    def load(self, save_dir):
        """Tải ma trận P, Q và bias từ thư mục models/."""
        self.P = np.load(os.path.join(save_dir, "P.npy"))
        self.Q = np.load(os.path.join(save_dir, "Q.npy"))
        self.b_u = np.load(os.path.join(save_dir, "b_u.npy"))
        self.b_i = np.load(os.path.join(save_dir, "b_i.npy"))
        self.mu = np.load(os.path.join(save_dir, "mu.npy"))[0]
        print(f"[CF] Đã tải model từ: {save_dir}")
        return self


# ===== KHỞI TẠO VÀ TẢI MODEL (LAZY LOADING) =====
svd = SVDModel(n_users=n_users, n_items=n_items, k=50, lr=0.005, reg=0.02, n_epochs=30)

def load_svd_model():
    model_files = ["P.npy", "Q.npy", "b_u.npy", "b_i.npy", "mu.npy"]
    model_exists = all(os.path.exists(os.path.join(models_dir, f)) for f in model_files)
    if model_exists:
        print("[CF] Phát hiện model đã được train, đang tải...")
        svd.load(models_dir)
    else:
        print("[CF] CẢNH BÁO: Chưa tìm thấy model đã train. Vui lòng chạy 'python src/train.py'.")

# Tải model ngay khi import để sẵn sàng phục vụ
load_svd_model()


# ===== LẤY TƯƠNG TÁC TỪ FIRESTORE QUA SDK HOẶC REST PHÂN TRANG =====
def fetch_firestore_interactions():
    import os
    import requests
    
    project_id = os.getenv("FIREBASE_PROJECT_ID", "")
    api_key = os.getenv("FIREBASE_API_KEY", "")
    
    new_interactions = []
    
    # 1. Đồng bộ Liked Songs (play_count = 5)
    url_liked = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/liked_songs"
    page_token = None
    while True:
        try:
            params = {}
            if api_key:
                params["key"] = api_key
            if page_token:
                params["pageToken"] = page_token
            
            resp = requests.get(url_liked, params=params, timeout=10)
            if resp.status_code != 200:
                break
                
            data = resp.json()
            documents = data.get("documents", [])
            for doc in documents:
                fields = doc.get("fields", {})
                user_id = fields.get("user_id", {}).get("stringValue")
                track_id = fields.get("track_id", {}).get("stringValue")
                if user_id and track_id:
                    new_interactions.append({
                        "user_id": str(user_id),
                        "track_id": track_id,
                        "play_count": 5
                    })
            page_token = data.get("nextPageToken")
            if not page_token:
                break
        except Exception as e:
            print(f"[Firestore REST Likes Fetch Error] {e}")
            break
            
    # 2. Đồng bộ Play History (play_count = 1)
    url_history = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/play_history"
    page_token = None
    while True:
        try:
            params = {}
            if api_key:
                params["key"] = api_key
            if page_token:
                params["pageToken"] = page_token
            
            resp = requests.get(url_history, params=params, timeout=10)
            if resp.status_code != 200:
                break
                
            data = resp.json()
            documents = data.get("documents", [])
            for doc in documents:
                fields = doc.get("fields", {})
                user_id = fields.get("user_id", {}).get("stringValue")
                track_id = fields.get("track_id", {}).get("stringValue")
                if user_id and track_id:
                    new_interactions.append({
                        "user_id": str(user_id),
                        "track_id": track_id,
                        "play_count": 1
                    })
            page_token = data.get("nextPageToken")
            if not page_token:
                break
        except Exception as e:
            print(f"[Firestore REST History Fetch Error] {e}")
            break
            
    return pd.DataFrame(new_interactions)


# ===== HÀM GỢI Ý CF TÍCH HỢP HUẤN LUYỆN TRỰC TUYẾN THỜI GIAN THỰC =====
def recommend_cf(user_id, top_n=5):
    """
    Hệ thống gợi ý Collaborative Filtering sử dụng phương pháp chiếu vector người dùng thời gian thực (Fold-in Projection).
    Đồng bộ trực tiếp lượt nghe/like từ Firestore, tính toán P_u & b_u tức thời (<1ms) mà không cần huấn luyện lại SVD.
    """
    global user_index, track_index, index_to_track, svd
    
    user_id_str = str(user_id)
    
    user_ratings = []
    listened_indices = []
    
    # 1. Lấy bài hát đã thích của user này từ Firestore collection "liked_songs"
    try:
        likes = fdb.query_documents("liked_songs", {"user_id": user_id_str})
        for l in likes:
            tid = l.get("track_id")
            if tid and tid in track_index:
                t_idx = track_index[tid]
                user_ratings.append((t_idx, np.log1p(5)))
                listened_indices.append(t_idx)
    except Exception as e:
        print(f"[CF] Lỗi lấy tương tác liked_songs từ Firestore: {e}")
        
    # 2. Lấy lịch sử phát nhạc từ Firestore collection "play_history"
    try:
        history = fdb.query_documents("play_history", {"user_id": user_id_str})
        # Group by track_id to sum play counts
        track_counts = {}
        for h in history:
            tid = h.get("track_id")
            if tid:
                track_counts[tid] = track_counts.get(tid, 0) + 1
                
        for tid, cnt in track_counts.items():
            if tid in track_index:
                t_idx = track_index[tid]
                # Nếu đã thích trước đó, cộng gộp play_count
                exists = False
                for idx, (existing_t_idx, existing_r) in enumerate(user_ratings):
                    if existing_t_idx == t_idx:
                        user_ratings[idx] = (t_idx, np.log1p(5 + cnt))
                        exists = True
                        break
                if not exists:
                    user_ratings.append((t_idx, np.log1p(cnt)))
                    listened_indices.append(t_idx)
    except Exception as e:
        print(f"[CF] Lỗi lấy lịch sử phát nhạc từ Firestore: {e}")


    # 2. Nếu tìm thấy tương tác thời gian thực, tiến hành chiếu Fold-in
    if user_ratings:
        p_u, b_u = svd.compute_user_latent_vector(user_ratings, n_iterations=30)
        top_scores = svd.predict_for_user_vector(p_u, b_u, listened_indices)[:top_n]
    else:
        # 3. Dự phòng 1: Nếu không có tương tác mới nhưng là user cũ trong base dataset
        if user_id_str in user_index:
            u_idx = user_index[user_id_str]
            # Lấy danh sách bài hát đã nghe của user này trong base dataset
            base_interactions = pd.read_csv(interactions_path)
            base_interactions["user_id"] = base_interactions["user_id"].astype(str)
            base_user_rows = base_interactions[base_interactions["user_id"] == user_id_str]
            base_listened = [
                track_index[tid] for tid in base_user_rows["track_id"].values
                if tid in track_index
            ]
            top_scores = svd.predict_for_user(u_idx, base_listened)[:top_n]
        else:
            # 4. Dự phòng 2 (Cold Start): Gợi ý bài hát có độ phổ biến cao nhất
            popular_songs = songs.sort_values(by="popularity", ascending=False).head(top_n)
            return popular_songs[["track_id", "track_name", "artists", "track_genre", "popularity"]]
            
    # Lấy thông tin bài hát từ chỉ mục
    top_track_ids = [index_to_track[i] for i, _ in top_scores]
    result = songs[songs["track_id"].isin(top_track_ids)][
        ["track_id", "track_name", "artists", "track_genre", "popularity"]
    ]
    return result
