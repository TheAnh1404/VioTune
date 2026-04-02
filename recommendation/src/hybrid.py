from src.content_based import recommend as content_recommend
from src.collaborative import recommend_cf

# ===== HYBRID FUNCTION =====
def hybrid_recommend(user_id, song_id, top_n=5, alpha=0.5):
    """
    user_id: dùng cho CF
    song_id: dùng cho Content-Based
    alpha: trọng số content-based (0 → 1)
    """

    beta = 1 - alpha

    # ===== LẤY KẾT QUẢ =====
    content_df = content_recommend(song_id, top_n=20)
    cf_df = recommend_cf(user_id, top_n=20)

    # nếu lỗi
    if isinstance(content_df, str):
        return content_df
    if isinstance(cf_df, str):
        return cf_df

    # ===== ADD SCORE =====
    content_df = content_df.copy()
    cf_df = cf_df.copy()

    content_df["score"] = [1/(i+1) for i in range(len(content_df))]
    cf_df["score"] = [1/(i+1) for i in range(len(cf_df))]

    # ===== MERGE =====
    combined = {}

    # content-based
    for _, row in content_df.iterrows():
        key = row["track_name"]
        combined[key] = {
            "artists": row["artists"],
            "genre": row["track_genre"],
            "score": alpha * row["score"]
        }

    # collaborative
    for _, row in cf_df.iterrows():
        key = row["track_name"]
        if key in combined:
            combined[key]["score"] += beta * row["score"]
        else:
            combined[key] = {
                "artists": row["artists"],
                "genre": row["track_genre"],
                "score": beta * row["score"]
            }

    # ===== SORT =====
    sorted_songs = sorted(combined.items(), key=lambda x: x[1]["score"], reverse=True)

    # ===== TOP N =====
    result = []
    for name, info in sorted_songs[:top_n]:
        result.append({
            "track_name": name,
            "artists": info["artists"],
            "track_genre": info["genre"]
        })

    return result