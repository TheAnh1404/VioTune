from src.content_based import recommend as content_recommend
from src.collaborative import recommend_cf

# ===== HYBRID FUNCTION =====
def hybrid_recommend(user_id, song_id, top_n=5, alpha=0.5):
    """
    Hệ thống gợi ý Hybrid: Kết hợp Content-Based và Collaborative Filtering.

    user_id : Dùng cho CF (SVD Matrix Factorization)
    song_id : Dùng cho Content-Based (KNN + Cosine Similarity)
    alpha   : Trọng số của Content-Based (0 → 1). CF nhận trọng số (1 - alpha).
    """
    beta = 1 - alpha

    # ===== LẤY KẾT QUẢ TỪ HAI MÔ HÌNH =====
    content_df = content_recommend(song_id, top_n=20)
    cf_result = recommend_cf(user_id, top_n=20)

    # Xử lý lỗi Content-Based
    if isinstance(content_df, str):
        return content_df

    # Nếu CF lỗi (user không tồn tại), chỉ dùng Content-Based
    cf_available = not isinstance(cf_result, str)

    # ===== GÁN ĐIỂM THEO THỨ HẠNG (Reciprocal Rank Scoring) =====
    content_df = content_df.copy()
    content_df["score"] = [1 / (i + 1) for i in range(len(content_df))]

    if cf_available:
        cf_df = cf_result.copy()
        cf_df["score"] = [1 / (i + 1) for i in range(len(cf_df))]

    # ===== MERGE VÀ KẾT HỢP ĐIỂM =====
    combined = {}

    # Điểm từ Content-Based
    for _, row in content_df.iterrows():
        key = row["track_name"]
        combined[key] = {
            "artists": row["artists"],
            "genre": row["track_genre"],
            "score": alpha * row["score"]
        }

    # Điểm từ Collaborative Filtering (nếu có)
    if cf_available:
        for _, row in cf_df.iterrows():
            key = row["track_name"]
            if key in combined:
                # Bài xuất hiện ở cả hai model → Cộng điểm thưởng
                combined[key]["score"] += beta * row["score"]
            else:
                combined[key] = {
                    "artists": row["artists"],
                    "genre": row["track_genre"],
                    "score": beta * row["score"]
                }

    # ===== SẮP XẾP VÀ TRẢ VỀ TOP N =====
    sorted_songs = sorted(combined.items(), key=lambda x: x[1]["score"], reverse=True)

    result = []
    for name, info in sorted_songs[:top_n]:
        result.append({
            "track_name": name,
            "artists": info["artists"],
            "track_genre": info["genre"]
        })

    return result