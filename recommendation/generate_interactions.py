import pandas as pd
import numpy as np
import os

print("Generating Synthetic User Data for Collaborative Filtering...")

# ==== 1. ĐƯỜNG DẪN ====
current_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(current_dir, "data/dataset.csv")
output_path = os.path.join(current_dir, "data/interactions.csv")

# Load thư viện bài hát
print("Loading dataset...")
df = pd.read_csv(dataset_path)

# ==== 2. THIẾT LẬP THUẬT TOÁN GIẢ LẬP ====
n_users = 200
user_interactions = []
genres_list = df['track_genre'].dropna().unique()

print(f"Bắt đầu tạo dữ liệu ảo cho {n_users} người dùng...")
np.random.seed(42)

for user_id in range(1, n_users + 1):
    # Cấu hình "Gu âm nhạc": Mỗi user thích 2-4 thể loại nhất định
    fav_genres = np.random.choice(genres_list, size=np.random.randint(2, 5), replace=False)
    
    for genre in fav_genres:
        songs = df[df['track_genre'] == genre]['track_id'].values
        if len(songs) > 0:
            # Nghe 10-20 bài trong thể loại yêu thích này
            listen_count = min(len(songs), np.random.randint(10, 20))
            for song in np.random.choice(songs, listen_count, replace=False):
                # Vì collaborative.py đang dùng cột 'play_count', ta giả lập số lần bấm nghe.
                # Bài đúng gu -> Nghe đi nghe lại nhiều lần (Từ 10 -> 50 lần)
                play_count = np.random.choice([10, 20, 30, 40, 50], p=[0.1, 0.2, 0.3, 0.3, 0.1])
                user_interactions.append([user_id, song, play_count])
    
    # Cấu hình "Noise": User thi thoảng tò mò nghe các bài lạ ngoài gu (Chỉ nghe 1-3 lần rồi bỏ)
    random_songs = df.sample(3)['track_id'].values
    for song in random_songs:
        user_interactions.append([user_id, song, np.random.randint(1, 4)])

# ==== 3. XUẤT RA FILE ====
# Cột lưu trữ: user_id, track_id, play_count (lần nghe thô)
# Lưu ý: collaborative.py sẽ tự áp dụng Log Normalization (log1p) khi train
df_interactions = pd.DataFrame(user_interactions, columns=['user_id', 'track_id', 'play_count'])
df_interactions.to_csv(output_path, index=False)

print(f"-> Hoàn tất! Đã tạo {len(df_interactions)} lượt nghe từ {n_users} users cá nhân hoá.")
print(f"-> Đã ghi đè file tại: {output_path}")
print("")
print("[!] Lưu ý: Bạn vừa tạo lại dữ liệu mới. Hãy xóa thư mục models/ để buộc hệ thống train lại mô hình SVD.")
print("    Lệnh xóa model cũ: rmdir /s /q models")
