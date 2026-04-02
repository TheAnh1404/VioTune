import os
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

# ===== LOAD DATA =====
current_dir = os.path.dirname(os.path.abspath(__file__))

songs_path = os.path.join(current_dir, "../data/dataset.csv")
interactions_path = os.path.join(current_dir, "../data/interactions.csv")

songs = pd.read_csv(songs_path)
interactions = pd.read_csv(interactions_path)

# ===== CLEAN DATA =====
interactions = interactions.dropna()
songs = songs.dropna(subset=["track_id", "track_name"])

# ===== CREATE USER-ITEM MATRIX =====
# rows = user, columns = song
if not interactions.empty:
    user_item_matrix = interactions.pivot_table(
        index="user_id",
        columns="track_id",
        values="play_count",
        fill_value=0
    )
    # transpose để tính similarity giữa các bài hát
    item_similarity = cosine_similarity(user_item_matrix.T)
    # convert thành DataFrame cho dễ xử lý
    item_similarity_df = pd.DataFrame(
        item_similarity,
        index=user_item_matrix.columns,
        columns=user_item_matrix.columns
    )
else:
    user_item_matrix = pd.DataFrame()
    item_similarity_df = pd.DataFrame()

# ===== RECOMMEND FUNCTION =====
def recommend_cf(user_id, top_n=5):
    # kiểm tra user tồn tại
    if user_id not in user_item_matrix.index:
        return "User không tồn tại."

    # lấy các bài user đã nghe
    user_data = user_item_matrix.loc[user_id]

    listened_songs = user_data[user_data > 0].index

    scores = {}

    # ===== TÍNH ĐIỂM =====
    for song in listened_songs:
        similar_songs = item_similarity_df[song]

        for other_song, sim_score in similar_songs.items():
            if other_song not in listened_songs:
                if other_song not in scores:
                    scores[other_song] = 0

                # weighted score
                scores[other_song] += sim_score * user_data[song]

    # ===== SORT =====
    sorted_songs = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    # lấy top N
    top_songs = [song_id for song_id, _ in sorted_songs[:top_n]]

    # map sang thông tin bài hát
    result = songs[songs["track_id"].isin(top_songs)]

    return result[["track_name", "artists", "track_genre"]] 