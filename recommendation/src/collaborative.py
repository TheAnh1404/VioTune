import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

# ===== ĐƯỜNG DẪN =====
current_dir = os.path.dirname(os.path.abspath(__file__))
songs_path = os.path.join(current_dir, "../data/dataset.csv")
interactions_path = os.path.join(current_dir, "../data/interactions.csv")
models_dir = os.path.join(current_dir, "../models")
os.makedirs(models_dir, exist_ok=True)

# ===== LOAD DỮ LIỆU =====
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

# if model_exists:
#     Load model đã train sẵn (không cần train lại)
#     print("[CF] Phát hiện model đã được train, đang tải...")
#     svd.load(models_dir)
# else:
# Train mới từ đầu
print("[CF] Bắt đầu huấn luyện SVD Model...")
svd.fit(train_data, test_data)
svd.save(models_dir)


# ===== HÀM GỢI Ý CF =====
def recommend_cf(user_id, top_n=5):
    """
    BƯỚC 6: Với user_id, trả về top_n bài hát gợi ý.
    """
    if user_id not in user_index:
        return f"User {user_id} không tồn tại trong dữ liệu tương tác."

    u_idx = user_index[user_id]

    # Lấy danh sách bài đã nghe của user này
    user_rows = interactions[interactions["user_id"] == user_id]
    listened_indices = [
        track_index[tid] for tid in user_rows["track_id"].values
        if tid in track_index
    ]

    # Lấy danh sách điểm dự đoán cho bài chưa nghe
    top_scores = svd.predict_for_user(u_idx, listened_indices)[:top_n]

    # Map item index → track_id → thông tin bài hát
    top_track_ids = [index_to_track[i] for i, _ in top_scores]
    result = songs[songs["track_id"].isin(top_track_ids)][
        ["track_name", "artists", "track_genre", "popularity"]
    ]

    return result