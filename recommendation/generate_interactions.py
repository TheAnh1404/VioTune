import pandas as pd
import numpy as np
import os
import sys

# Configure UTF-8 encoding for Windows terminals
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

print("======================================================================")
print("  VioTune — BỘ GIẢ LẬP DỮ LIỆU TƯƠNG TÁC NGƯỜI DÙNG PHÂN CỤM (v2.0)  ")
print("======================================================================")

# ==== 1. ĐƯỜNG DẪN ====
current_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(current_dir, "data/dataset.csv")
output_path = os.path.join(current_dir, "data/interactions.csv")

# Tải bộ dữ liệu gốc
print("Đang tải dataset...")
df = pd.read_csv(dataset_path)

# Loại bỏ các dòng thiếu thông tin đặc trưng
features = ["danceability", "energy", "acousticness", "instrumentalness", "liveness", "valence", "tempo"]
df = df.dropna(subset=features + ["track_id", "track_genre", "popularity", "artists"])
df = df.reset_index(drop=True)

# ==== 2. ĐỊNH NGHĨA CÁC CỤM NGƯỜI DÙNG (CLUSTERS) ====
clusters_config = {
    1: {
        "name": "Nhạc nhẹ nhàng (Gentle/Soft)",
        "size": 100,
        "genres": ['acoustic', 'ambient', 'classical', 'chill', 'jazz', 'piano', 'sleep', 'study', 'new-age', 'romance', 'sad', 'opera', 'blues'],
        "filters": lambda x: (x['energy'] <= 0.4) & (x['acousticness'] >= 0.5)
    },
    2: {
        "name": "Nhạc sôi động (Energetic/Lively)",
        "size": 300,
        "genres": ['dance', 'edm', 'electro', 'electronic', 'house', 'techno', 'trance', 'club', 'dubstep', 'drum-and-bass', 'progressive-house', 'hard-rock', 'metal', 'heavy-metal', 'punk', 'hardcore', 'hardstyle', 'detroit-techno', 'alt-rock', 'black-metal', 'death-metal'],
        "filters": lambda x: (x['energy'] >= 0.6) & (x['danceability'] >= 0.5)
    },
    3: {
        "name": "Hip-Hop, Rap, R&B, Funk & Latin Urban",
        "size": 200,
        "genres": ['hip-hop', 'r-n-b', 'reggae', 'reggaeton', 'funk', 'afrobeat', 'trip-hop', 'latin', 'latino', 'salsa', 'samba'],
        "filters": lambda x: x['danceability'] >= 0.6
    },
    4: {
        "name": "Pop Hits & Global Culture",
        "size": 200,
        "genres": ['pop', 'indie-pop', 'j-pop', 'k-pop', 'cantopop', 'mandopop', 'anime', 'disney', 'happy', 'party'],
        "filters": lambda x: x['valence'] >= 0.4
    },
    5: {
        "name": "Rock, Folk, Indie, Country & Acoustic Roots",
        "size": 200,
        "genres": ['folk', 'indie', 'country', 'bluegrass', 'rock', 'rock-n-roll', 'rockabilly', 'honky-tonk', 'grunge', 'guitar', 'singer-songwriter'],
        "filters": lambda x: (x['acousticness'] >= 0.1) & (x['energy'] >= 0.3)
    }
}

# Tạo Global Hot Pool (Top 200 bài hát phổ biến nhất toàn hệ thống)
global_hot_pool = df.sort_values(by="popularity", ascending=False).head(200)['track_id'].values

print("\n--- CHUẨN BỊ KHO BÀI HÁT THEO TỪNG CỤM ---")
cluster_pools = {}
np.random.seed(42)

for cid, config in clusters_config.items():
    # Lọc bài hát theo thể loại và đặc trưng âm học
    genre_filtered = df[df['track_genre'].isin(config["genres"])]
    pool = genre_filtered[config["filters"](genre_filtered)]
    
    # Fallback nếu bộ lọc quá khắt khe
    if len(pool) < 200:
        pool = genre_filtered
        
    # Tạo Hot Pool cho cụm này (Top 150 bài hát được ưa chuộng nhất trong cụm)
    hot_pool = pool.sort_values(by="popularity", ascending=False).head(150)['track_id'].values
    long_tail_pool = pool[~pool['track_id'].isin(hot_pool)]['track_id'].values
    
    cluster_pools[cid] = {
        "hot": hot_pool,
        "long_tail": long_tail_pool,
        "all": pool['track_id'].values
    }
    
    print(f"Cụm {cid} [{config['name']}]:")
    print(f"  - Tổng số bài hát phù hợp: {len(pool)}")
    print(f"  - Kích thước Hot Pool: {len(hot_pool)} | Long Tail: {len(long_tail_pool)}")

# ==== 3. TIẾN HÀNH GIẢ LẬP TƯƠNG TÁC CHO 1000 USERS ====
print("\n--- TIẾN HÀNH GIẢ LẬP TƯƠNG TÁC ---")
user_interactions = []
current_user_id = 1

for cid, config in clusters_config.items():
    print(f"Đang sinh tương tác cho Cụm {cid} ({config['size']} users)...")
    pools = cluster_pools[cid]
    
    for _ in range(config["size"]):
        user_id = current_user_id
        
        # Số lượng bài hát mỗi user nghe (ngẫu nhiên trong khoảng 25 đến 45)
        num_hot = np.random.randint(18, 30)
        num_long_tail = np.random.randint(5, 12)
        num_global = np.random.randint(2, 5)
        num_noise = np.random.randint(1, 3)
        
        # 1. Chọn bài từ Cluster Hot Pool (Độ trùng lặp cao trong cụm, nghe nhiều lần)
        selected_hot = np.random.choice(pools["hot"], size=min(len(pools["hot"]), num_hot), replace=False)
        for song in selected_hot:
            # Nghe nhiều (15 -> 50 lần)
            play_count = np.random.choice([15, 20, 25, 30, 35, 40, 45, 50], p=[0.1, 0.15, 0.2, 0.2, 0.15, 0.1, 0.05, 0.05])
            user_interactions.append([user_id, song, play_count])
            
        # 2. Chọn bài từ Cluster Long Tail (Độ trùng lặp thấp, nghe trung bình)
        if len(pools["long_tail"]) > 0:
            selected_lt = np.random.choice(pools["long_tail"], size=min(len(pools["long_tail"]), num_long_tail), replace=False)
            for song in selected_lt:
                # Nghe vừa (5 -> 20 lần)
                play_count = np.random.randint(5, 21)
                user_interactions.append([user_id, song, play_count])
                
        # 3. Chọn bài từ Global Hot Pool (Sự giao thoa tự nhiên giữa các cụm)
        selected_global = np.random.choice(global_hot_pool, size=num_global, replace=False)
        for song in selected_global:
            # Nghe ít đến vừa (3 -> 15 lần)
            play_count = np.random.randint(3, 16)
            user_interactions.append([user_id, song, play_count])
            
        # 4. Chọn bài nhiễu hoàn toàn ngẫu nhiên (Noise)
        selected_noise = df.sample(num_noise)['track_id'].values
        for song in selected_noise:
            # Nghe thử (1 -> 3 lần)
            play_count = np.random.randint(1, 4)
            user_interactions.append([user_id, song, play_count])
            
        current_user_id += 1

# ==== 4. LƯU DỮ LIỆU & THỐNG KÊ ====
df_interactions = pd.DataFrame(user_interactions, columns=['user_id', 'track_id', 'play_count'])
df_interactions.to_csv(output_path, index=False)

# Thống kê
n_unique_users = df_interactions['user_id'].nunique()
n_unique_songs = df_interactions['track_id'].nunique()
sparsity = (1 - len(df_interactions) / (n_unique_users * len(df))) * 100

print("\n--- THỐNG KÊ BỘ DỮ LIỆU TƯƠNG TÁC MỚI ---")
print(f"-> Tổng số lượt nghe (Interactions): {len(df_interactions)}")
print(f"-> Số người dùng unique (Users): {n_unique_users}")
print(f"-> Số bài hát unique được tương tác (Songs): {n_unique_songs}")
print(f"-> Độ thưa của ma trận tương tác (Sparsity): {sparsity:.4f}%")
print(f"-> File đã được ghi đè tại: {output_path}")
print()
print("[!] Lưu ý quan trọng: Bộ dữ liệu interactions đã thay đổi lớn.")
print("    Hãy huấn luyện lại mô hình SVD và chạy lại script đánh giá để cập nhật chỉ số.")
print("    Lệnh huấn luyện lại: python src/train.py")
print("    Lệnh đánh giá so sánh: python src/evaluate.py")
print("======================================================================")
