import os
from src.content_based import recommend
from src.collaborative import recommend_cf
from src.hybrid import hybrid_recommend
import pandas as pd

# Lấy đường dẫn tuyệt đối để load dataset
current_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(current_dir, "data/dataset.csv")

# Load dataset để lấy thử 1 track_id
songs = pd.read_csv(dataset_path)

# Lấy ngẫu nhiên 1 bài hát
sample_song = songs.sample(1).iloc[0]

track_id = sample_song["track_id"]

print("🎵 Bài hát gốc:")
print(f"{sample_song['track_name']} - {sample_song['artists']}")
print("-" * 40)

# Gọi hàm recommend
result = recommend(track_id)

print("🔥 Gợi ý bài hát:")
print(result)

print("🎧 Gợi ý theo Collaborative:")
print(recommend_cf(user_id=1))

print("🚀 Hybrid Recommendation:")
print(hybrid_recommend(user_id=1, song_id=track_id))

for song in result:
    print(song)