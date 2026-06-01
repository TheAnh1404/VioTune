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
        """
        listened_set = set(listened_item_indices)

        scores = []
        for i in range(self.Q.shape[0]):
            if i not in listened_set:
                score = self._predict(u_idx, i)
                scores.append((i, score))

        # Sắp xếp theo điểm dự đoán từ cao đến thấp
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores

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
        """
        listened_set = set(listened_item_indices)
        scores = []
        for i in range(self.Q.shape[0]):
            if i not in listened_set:
                score = self.mu + b_u + self.b_i[i] + self.Q[i].dot(p_u)
                scores.append((i, score))
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores

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


# ===== KHỞI TẠO VÀ HUẤN LUYỆN HOẶC TẢI MODEL =====
model_files = ["P.npy", "Q.npy", "b_u.npy", "b_i.npy", "mu.npy"]
model_exists = all(os.path.exists(os.path.join(models_dir, f)) for f in model_files)

svd = SVDModel(n_users=n_users, n_items=n_items, k=50, lr=0.005, reg=0.02, n_epochs=30)

if model_exists:
    # Load model đã train sẵn (không cần train lại)
    print("[CF] Phát hiện model đã được train, đang tải...")
    svd.load(models_dir)
else:
    # Train mới từ đầu
    print("[CF] Bắt đầu huấn luyện SVD Model...")
    svd.fit(train_data, test_data)
    svd.save(models_dir)


# ===== LẤY TƯƠNG TÁC TỪ FIRESTORE QUA SDK HOẶC REST PHÂN TRANG =====
def fetch_firestore_interactions():
    import os
    import requests
    
    # Load .env configurations
    project_id = os.getenv("FIREBASE_PROJECT_ID", "viotune-music")
    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    
    new_interactions = []
    
    # 1. Thử dùng Official SDK nếu có cấu hình credentials
    if credentials_path and os.path.exists(credentials_path):
        try:
            from google.oauth2 import service_account
            from google.cloud import firestore
            
            print("[Firestore SDK] Đang kết nối bằng Google Cloud SDK...")
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            db = firestore.Client(project=project_id, credentials=credentials)
            
            users_ref = db.collection("users")
            for doc_item in users_ref.stream():
                uid = doc_item.id
                data = doc_item.to_dict()
                
                # Likes: 5 điểm tương tác
                liked_songs = data.get("likedSongs", [])
                for song in liked_songs:
                    track_id = song.get("track_id")
                    if track_id:
                        new_interactions.append({
                            "user_id": str(uid),
                            "track_id": track_id,
                            "play_count": 5
                        })
                        
                # Lịch sử phát: 1 điểm mỗi lượt
                play_history = data.get("playHistory", [])
                for song in play_history:
                    track_id = song.get("track_id")
                    if track_id:
                        new_interactions.append({
                            "user_id": str(uid),
                            "track_id": track_id,
                            "play_count": 1
                        })
            
            print(f"[Firestore SDK] Đồng bộ thành công {len(new_interactions)} tương tác.")
            return pd.DataFrame(new_interactions)
            
        except Exception as sdk_err:
            print(f"[Firestore SDK] Lỗi SDK: {sdk_err}. Chuyển sang dùng REST phân trang...")
            
    # 2. Cơ chế dự phòng REST API Phân trang (Resilient Paginated REST Fallback)
    print("[Firestore REST] Đang đồng bộ bằng REST API có phân trang...")
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/users"
    page_token = None
    
    while True:
        try:
            params = {}
            if page_token:
                params["pageToken"] = page_token
            
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code != 200:
                print(f"[Firestore REST] Lỗi mã phản hồi: {resp.status_code}")
                break
                
            data = resp.json()
            documents = data.get("documents", [])
            
            for doc_item in documents:
                name_path = doc_item.get("name", "")
                uid = name_path.split("/")[-1]
                fields = doc_item.get("fields", {})
                
                # Lấy lượt thích
                liked_songs = fields.get("likedSongs", {}).get("arrayValue", {}).get("values", [])
                for song_val in liked_songs:
                    song_fields = song_val.get("mapValue", {}).get("fields", {})
                    track_id = song_fields.get("track_id", {}).get("stringValue")
                    if track_id:
                        new_interactions.append({
                            "user_id": str(uid),
                            "track_id": track_id,
                            "play_count": 5
                        })
                
                # Lấy lịch sử phát
                play_history = fields.get("playHistory", {}).get("arrayValue", {}).get("values", [])
                for play_val in play_history:
                    play_fields = play_val.get("mapValue", {}).get("fields", {})
                    track_id = play_fields.get("track_id", {}).get("stringValue")
                    if track_id:
                        new_interactions.append({
                            "user_id": str(uid),
                            "track_id": track_id,
                            "play_count": 1
                        })
                        
            # Lấy token trang tiếp theo
            page_token = data.get("nextPageToken")
            if not page_token:
                break
                
        except Exception as e:
            print(f"[Firestore REST] Lỗi đồng bộ: {e}")
            break
            
    print(f"[Firestore REST] Đồng bộ thành công {len(new_interactions)} tương tác.")
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
    
    # 1a. Lấy tương tác cục bộ từ SQLite (liked_songs = 5 play_count, play_history = 1 play_count)
    try:
        import sqlite3
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Thích bài hát
        cursor.execute("SELECT track_id FROM liked_songs WHERE user_id = ?", (user_id_str,))
        for row in cursor.fetchall():
            tid = row[0]
            if tid in track_index:
                t_idx = track_index[tid]
                user_ratings.append((t_idx, np.log1p(5)))
                listened_indices.append(t_idx)
                
        # Lịch sử nghe nhạc
        cursor.execute("SELECT track_id, COUNT(*) FROM play_history WHERE user_id = ? GROUP BY track_id", (user_id_str,))
        for row in cursor.fetchall():
            tid, cnt = row[0], row[1]
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
                    
        conn.close()
    except Exception as e:
        print(f"[CF] Lỗi lấy tương tác SQLite: {e}")
        
    # 1b. Gộp với dữ liệu Firestore từ SDK/REST
    try:
        firestore_df = fetch_firestore_interactions()
        if not firestore_df.empty:
            user_rows = firestore_df[firestore_df["user_id"] == user_id_str]
            if not user_rows.empty:
                for _, row in user_rows.iterrows():
                    tid = row["track_id"]
                    if tid in track_index:
                        t_idx = track_index[tid]
                        # Tránh trùng lặp với SQLite cục bộ
                        exists = False
                        for idx, (existing_t_idx, existing_r) in enumerate(user_ratings):
                            if existing_t_idx == t_idx:
                                exists = True
                                break
                        if not exists:
                            r = np.log1p(row["play_count"])
                            user_ratings.append((t_idx, r))
                            listened_indices.append(t_idx)
    except Exception as e:
        print(f"[CF] Lỗi lấy tương tác Firestore: {e}")


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