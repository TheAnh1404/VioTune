from src.content_based import recommend_multi
from src.collaborative import recommend_cf

# ===== HYBRID FUNCTION =====
def hybrid_recommend(user_id, song_ids, top_n=5, alpha=0.5, discovery_mode=False):
    """
    Hệ thống gợi ý Hybrid: Kết hợp Content-Based và Collaborative Filtering.

    user_id        : Dùng cho CF (SVD Matrix Factorization) và Dynamic Profile Matching
    song_ids       : Danh sách track_id dùng làm hạt giống cho Content-Based
    alpha          : Trọng số của Content-Based (0 → 1). CF nhận trọng số (1 - alpha).
    discovery_mode : Chế độ khám phá (kích hoạt Inverse Popularity Discounting)
    """
    beta = 1 - alpha

    # ===== LẤY KẾT QUẢ TỪ HAI MÔ HÌNH =====
    # Content-Based dùng multi-seed và truyền user_id + discovery_mode
    content_df = recommend_multi(song_ids, top_n=20, user_id=user_id, discovery_mode=discovery_mode)
    
    # Collaborative Filtering gợi ý dựa trên user profile và truyền discovery_mode
    cf_result = recommend_cf(user_id, top_n=20, discovery_mode=discovery_mode)

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
        key = row["track_id"]
        combined[key] = {
            "track_name": row["track_name"],
            "artists": row["artists"],
            "genre": row["track_genre"],
            "popularity": row["popularity"],
            "score": alpha * row["score"]
        }

    # Điểm từ Collaborative Filtering (nếu có)
    if cf_available:
        for _, row in cf_df.iterrows():
            key = row["track_id"]
            if key in combined:
                # Bài xuất hiện ở cả hai model → Cộng điểm thưởng
                combined[key]["score"] += beta * row["score"]
            else:
                combined[key] = {
                    "track_name": row["track_name"],
                    "artists": row["artists"],
                    "genre": row["track_genre"],
                    "popularity": row["popularity"],
                    "score": beta * row["score"]
                }

    # ===== SẮP XẾP VÀ TRẢ VỀ TOP N =====
    sorted_songs = sorted(combined.items(), key=lambda x: x[1]["score"], reverse=True)

    result = []
    for tid, info in sorted_songs[:top_n]:
        result.append({
            "track_id": tid,
            "track_name": info["track_name"],
            "artists": info["artists"],
            "track_genre": info["genre"],
            "popularity": info["popularity"]
        })

    return result