"""
╔══════════════════════════════════════════════════════════════════════╗
║  VioTune — Bộ đánh giá chất lượng mô hình gợi ý (Evaluation Suite) ║
║                                                                      ║
║  So sánh 3 mô hình:                                                 ║
║    1. Content-Based Filtering (CB)  — KNN Cosine                    ║
║    2. Collaborative Filtering (CF)  — SVD Matrix Factorization      ║
║    3. Hybrid Engine                 — Reciprocal Rank Fusion        ║
║                                                                      ║
║  Metrics: Precision@K, Recall@K, F1@K, NDCG@K,                     ║
║           Hit Rate@K, MAP@K, Coverage, Diversity                    ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import numpy as np
import pandas as pd
from collections import defaultdict
from sklearn.model_selection import train_test_split

# ─── Path Configuration ─────────────────────────────────────────────
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Encoding fix for Windows terminals
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass


# =====================================================================
#  PHẦN 1: CÁC HÀM TÍNH METRIC ĐÁNH GIÁ
# =====================================================================

def precision_at_k(recommended: list, relevant: set, k: int) -> float:
    """
    Precision@K = |{recommended ∩ relevant}| / K
    Tỷ lệ bài hát trong top-K gợi ý mà người dùng thực sự thích.
    """
    rec_k = recommended[:k]
    if not rec_k:
        return 0.0
    hits = len(set(rec_k) & relevant)
    return hits / k


def recall_at_k(recommended: list, relevant: set, k: int) -> float:
    """
    Recall@K = |{recommended ∩ relevant}| / |relevant|
    Tỷ lệ bài hát yêu thích được hệ thống tìm thấy trong top-K.
    """
    rec_k = recommended[:k]
    if not relevant:
        return 0.0
    hits = len(set(rec_k) & relevant)
    return hits / len(relevant)


def f1_at_k(recommended: list, relevant: set, k: int) -> float:
    """
    F1@K = 2 × Precision@K × Recall@K / (Precision@K + Recall@K)
    Trung bình điều hòa giữa Precision và Recall.
    """
    p = precision_at_k(recommended, relevant, k)
    r = recall_at_k(recommended, relevant, k)
    if p + r == 0:
        return 0.0
    return 2 * p * r / (p + r)


def ndcg_at_k(recommended: list, relevant: set, k: int) -> float:
    """
    NDCG@K = DCG@K / IDCG@K (Normalized Discounted Cumulative Gain)
    Đánh giá chất lượng xếp hạng — bài hát đúng ở vị trí cao hơn được thưởng nhiều hơn.
    
    DCG@K  = Σ_{i=1}^{K} rel_i / log₂(i + 1)
    IDCG@K = DCG@K cho trường hợp xếp hạng hoàn hảo
    """
    rec_k = recommended[:k]
    
    # DCG: Discounted Cumulative Gain
    dcg = 0.0
    for i, item in enumerate(rec_k):
        rel = 1.0 if item in relevant else 0.0
        dcg += rel / np.log2(i + 2)  # i+2 vì log2(1)=0
    
    # IDCG: Ideal DCG (trường hợp hoàn hảo)
    ideal_hits = min(len(relevant), k)
    idcg = sum(1.0 / np.log2(i + 2) for i in range(ideal_hits))
    
    if idcg == 0:
        return 0.0
    return dcg / idcg


def average_precision(recommended: list, relevant: set, k: int) -> float:
    """
    AP@K = (1/|relevant|) × Σ_{k=1}^{K} Precision@k × rel(k)
    Trung bình Precision tại mỗi vị trí có hit.
    """
    rec_k = recommended[:k]
    if not relevant:
        return 0.0
    
    score = 0.0
    hits = 0
    for i, item in enumerate(rec_k):
        if item in relevant:
            hits += 1
            score += hits / (i + 1)
    
    return score / min(len(relevant), k)


def hit_rate_at_k(recommended: list, relevant: set, k: int) -> float:
    """
    Hit Rate@K = 1 nếu có ít nhất 1 bài đúng trong top-K, ngược lại = 0.
    """
    rec_k = recommended[:k]
    return 1.0 if len(set(rec_k) & relevant) > 0 else 0.0


def compute_all_metrics(recommended: list, relevant: set, k: int) -> dict:
    """Tính toàn bộ metrics cho một cặp (user, recommendations)."""
    return {
        "Precision@K": precision_at_k(recommended, relevant, k),
        "Recall@K": recall_at_k(recommended, relevant, k),
        "F1@K": f1_at_k(recommended, relevant, k),
        "NDCG@K": ndcg_at_k(recommended, relevant, k),
        "MAP@K": average_precision(recommended, relevant, k),
        "Hit Rate@K": hit_rate_at_k(recommended, relevant, k),
    }


# =====================================================================
#  PHẦN 2: CHUẨN BỊ DỮ LIỆU ĐÁNH GIÁ (Leave-N-Out Protocol)
# =====================================================================

def prepare_evaluation_data(interactions_path, songs_path, n_holdout=3, min_interactions=5):
    """
    Phương pháp Leave-N-Out:
    - Với mỗi user có >= min_interactions tương tác,
      giữ lại n_holdout bài hát có play_count cao nhất làm "ground truth" (test set).
    - Phần còn lại là "profile" (train set) dùng để gợi ý.
    """
    print("=" * 70)
    print("  CHUẨN BỊ DỮ LIỆU ĐÁNH GIÁ (Leave-N-Out Protocol)")
    print("=" * 70)
    
    interactions = pd.read_csv(interactions_path)
    
    try:
        import sqlite3
        db_path = os.path.join(current_dir, "../data/viotune.db")
        conn = sqlite3.connect(db_path)
        songs = pd.read_sql("SELECT * FROM songs", conn)
        conn.close()
    except Exception:
        songs = pd.read_csv(songs_path)
    
    all_track_ids = set(songs["track_id"].unique())
    
    # Lọc user có đủ tương tác
    user_counts = interactions.groupby("user_id").size()
    eligible_users = user_counts[user_counts >= min_interactions].index.tolist()
    
    print(f"  Tổng users: {len(user_counts)} | Eligible (>= {min_interactions} interactions): {len(eligible_users)}")
    
    eval_data = []
    for uid in eligible_users:
        user_rows = interactions[interactions["user_id"] == uid].copy()
        user_rows = user_rows.sort_values("play_count", ascending=False)
        
        # Top-N bài nghe nhiều nhất làm ground truth
        holdout = user_rows.head(n_holdout)
        profile = user_rows.iloc[n_holdout:]
        
        holdout_tracks = set(holdout["track_id"].tolist())
        profile_tracks = profile["track_id"].tolist()
        
        if len(holdout_tracks) > 0 and len(profile_tracks) > 0:
            eval_data.append({
                "user_id": uid,
                "profile_tracks": profile_tracks,
                "ground_truth": holdout_tracks,
                "play_counts": dict(zip(user_rows["track_id"], user_rows["play_count"]))
            })
    
    print(f"  Users đủ điều kiện đánh giá: {len(eval_data)}")
    print(f"  Holdout items per user: {n_holdout}")
    print()
    
    return eval_data, songs, all_track_ids


# =====================================================================
#  PHẦN 3: HÀM GỢI Ý CHO TỪNG MÔ HÌNH (Evaluation Wrappers)
# =====================================================================

def cb_recommend_for_eval(profile_tracks, top_n, songs_df):
    """Content-Based: Gợi ý dựa trên danh sách bài hát profile (multi-seed KNN)."""
    from content_based import recommend_multi
    try:
        result = recommend_multi(profile_tracks, top_n=top_n)
        if isinstance(result, str):
            return []
        return result["track_id"].tolist()
    except Exception as e:
        return []


def cf_recommend_for_eval(user_id, profile_tracks, play_counts, top_n, songs_df):
    """
    Collaborative Filtering OFFLINE: Dùng SVD Fold-in Projection trực tiếp
    với dữ liệu local (không gọi Firestore) để đánh giá nhanh.
    """
    from collaborative import svd, track_index, index_to_track, songs, user_index
    try:
        # Tạo user_ratings từ profile_tracks local (giống logic recommend_cf nhưng offline)
        user_ratings = []
        listened_indices = []
        
        for tid in profile_tracks:
            if tid in track_index:
                t_idx = track_index[tid]
                pc = play_counts.get(tid, 1)
                user_ratings.append((t_idx, np.log1p(pc)))
                listened_indices.append(t_idx)
        
        if user_ratings:
            # Fold-in projection: Tính P_u và b_u cho user này
            p_u, b_u = svd.compute_user_latent_vector(user_ratings, n_iterations=30)
            top_scores = svd.predict_for_user_vector(p_u, b_u, listened_indices)[:top_n]
        elif str(user_id) in user_index:
            # User cũ trong base dataset
            u_idx = user_index[str(user_id)]
            base_listened = [track_index[tid] for tid in profile_tracks if tid in track_index]
            top_scores = svd.predict_for_user(u_idx, base_listened)[:top_n]
        else:
            # Cold start fallback
            popular = songs.sort_values("popularity", ascending=False).head(top_n)
            return popular["track_id"].tolist()
        
        top_track_ids = [index_to_track[i] for i, _ in top_scores]
        return top_track_ids
    except Exception as e:
        return []


def hybrid_recommend_for_eval(user_id, profile_tracks, play_counts, top_n, alpha=0.5):
    """
    Hybrid OFFLINE: Kết hợp CB + CF offline bằng Reciprocal Rank Fusion.
    Không gọi Firestore — dùng dữ liệu local cho cả 2 model.
    """
    from content_based import recommend_multi, songs as cb_songs
    from collaborative import svd, track_index, index_to_track, songs as cf_songs, user_index
    
    try:
        beta = 1 - alpha
        
        # ── CB: Content-Based multi-seed ──
        content_df = recommend_multi(profile_tracks[:10], top_n=20)
        if isinstance(content_df, str):
            content_results = []
        else:
            content_results = content_df[["track_id", "track_name", "artists", "track_genre", "popularity"]].to_dict('records')
        
        # ── CF: Offline SVD Fold-in ──
        cf_results = []
        user_ratings = []
        listened_indices = []
        for tid in profile_tracks:
            if tid in track_index:
                t_idx = track_index[tid]
                pc = play_counts.get(tid, 1)
                user_ratings.append((t_idx, np.log1p(pc)))
                listened_indices.append(t_idx)
        
        if user_ratings:
            p_u, b_u = svd.compute_user_latent_vector(user_ratings, n_iterations=30)
            top_scores = svd.predict_for_user_vector(p_u, b_u, listened_indices)[:20]
            top_tids = [index_to_track[i] for i, _ in top_scores]
            cf_df = cf_songs[cf_songs["track_id"].isin(top_tids)]
            cf_results = cf_df[["track_id", "track_name", "artists", "track_genre", "popularity"]].to_dict('records')
        
        # ── Reciprocal Rank Fusion ──
        combined = {}
        
        for rank, row in enumerate(content_results):
            key = row["track_id"]
            combined[key] = {
                "track_id": key,
                "score": alpha * (1 / (rank + 1))
            }
        
        for rank, row in enumerate(cf_results):
            key = row["track_id"]
            if key in combined:
                combined[key]["score"] += beta * (1 / (rank + 1))
            else:
                combined[key] = {
                    "track_id": key,
                    "score": beta * (1 / (rank + 1))
                }
        
        sorted_songs = sorted(combined.values(), key=lambda x: x["score"], reverse=True)
        return [s["track_id"] for s in sorted_songs[:top_n]]
    except Exception as e:
        return []


# =====================================================================
#  PHẦN 4: CHẠY ĐÁNH GIÁ TOÀN DIỆN
# =====================================================================

def evaluate_model(model_name, recommend_fn, eval_data, k_values, all_track_ids):
    """
    Đánh giá một mô hình trên toàn bộ test users.
    Trả về dict {k: {metric_name: average_value}}.
    """
    results = {k: defaultdict(list) for k in k_values}
    all_recommended = set()
    
    n_users = len(eval_data)
    for idx, item in enumerate(eval_data):
        # Lấy danh sách gợi ý từ model
        max_k = max(k_values)
        recommended = recommend_fn(item, max_k)
        
        if not recommended:
            continue
        
        all_recommended.update(recommended)
        ground_truth = item["ground_truth"]
        
        for k in k_values:
            metrics = compute_all_metrics(recommended, ground_truth, k)
            for metric_name, value in metrics.items():
                results[k][metric_name].append(value)
        
        # Progress indicator
        if (idx + 1) % 50 == 0 or idx == n_users - 1:
            print(f"    [{model_name}] Evaluated {idx + 1}/{n_users} users...")
    
    # Tính trung bình
    avg_results = {}
    for k in k_values:
        avg_results[k] = {}
        for metric_name in results[k]:
            values = results[k][metric_name]
            avg_results[k][metric_name] = np.mean(values) if values else 0.0
    
    # Coverage: tỷ lệ bài hát trong catalog được gợi ý ít nhất 1 lần
    coverage = len(all_recommended) / len(all_track_ids) if all_track_ids else 0.0
    
    return avg_results, coverage


def run_full_evaluation():
    """Chạy toàn bộ quy trình đánh giá và in báo cáo so sánh."""
    
    interactions_path = os.path.join(current_dir, "../data/interactions.csv")
    songs_path = os.path.join(current_dir, "../data/dataset.csv")
    
    # Tham số đánh giá
    K_VALUES = [5, 10, 15]
    N_HOLDOUT = 3
    MIN_INTERACTIONS = 5
    
    # 1. Chuẩn bị dữ liệu
    eval_data, songs_df, all_track_ids = prepare_evaluation_data(
        interactions_path, songs_path, 
        n_holdout=N_HOLDOUT, min_interactions=MIN_INTERACTIONS
    )
    
    if not eval_data:
        print("[ERROR] Không có user nào đủ điều kiện để đánh giá!")
        return
    
    # 2. Định nghĩa wrapper functions cho từng model
    def cb_wrapper(item, top_n):
        return cb_recommend_for_eval(item["profile_tracks"][:10], top_n, songs_df)
    
    def cf_wrapper(item, top_n):
        return cf_recommend_for_eval(
            item["user_id"], item["profile_tracks"], item["play_counts"], top_n, songs_df
        )
    
    def hybrid_wrapper(item, top_n):
        return hybrid_recommend_for_eval(
            item["user_id"], item["profile_tracks"][:10], item["play_counts"], top_n, alpha=0.5
        )
    
    # 3. Đánh giá từng model
    models = [
        ("Content-Based (CB)", cb_wrapper),
        ("Collaborative (CF)", cf_wrapper),
        ("Hybrid (CB+CF)", hybrid_wrapper),
    ]
    
    all_results = {}
    all_coverage = {}
    
    for model_name, wrapper_fn in models:
        print(f"\n{'─' * 70}")
        print(f"  ĐÁNH GIÁ: {model_name}")
        print(f"{'─' * 70}")
        
        avg_results, coverage = evaluate_model(
            model_name, wrapper_fn, eval_data, K_VALUES, all_track_ids
        )
        all_results[model_name] = avg_results
        all_coverage[model_name] = coverage
    
    # 4. In báo cáo so sánh
    print_comparison_report(all_results, all_coverage, K_VALUES, len(eval_data))
    
    # 5. Tính điểm cải thiện Hybrid so với CB và CF
    print_improvement_analysis(all_results, K_VALUES)
    
    return all_results, all_coverage


# =====================================================================
#  PHẦN 5: IN BÁO CÁO SO SÁNH
# =====================================================================

def print_comparison_report(all_results, all_coverage, k_values, n_users):
    """In bảng so sánh chi tiết giữa các mô hình."""
    
    model_names = list(all_results.keys())
    metrics = ["Precision@K", "Recall@K", "F1@K", "NDCG@K", "MAP@K", "Hit Rate@K"]
    
    print("\n")
    print("╔" + "═" * 78 + "╗")
    print("║" + "  BÁO CÁO ĐÁNH GIÁ SO SÁNH MÔ HÌNH GỢI Ý — VioTune".center(78) + "║")
    print("║" + f"  Số lượng users đánh giá: {n_users}".center(78) + "║")
    print("╚" + "═" * 78 + "╝")
    
    for k in k_values:
        print(f"\n┌{'─' * 78}┐")
        print(f"│{'  K = ' + str(k):^78}│")
        print(f"├{'─' * 22}┬{'─' * 18}┬{'─' * 18}┬{'─' * 18}┤")
        
        header = f"│ {'Metric':<20} │"
        for name in model_names:
            short = name.split('(')[1].rstrip(')') if '(' in name else name[:14]
            header += f" {short:^16} │"
        print(header)
        
        print(f"├{'─' * 22}┼{'─' * 18}┼{'─' * 18}┼{'─' * 18}┤")
        
        for metric in metrics:
            row = f"│ {metric:<20} │"
            values = []
            for name in model_names:
                val = all_results[name][k].get(metric, 0.0)
                values.append(val)
                row += f" {val:>14.4f}   │"
            
            # Đánh dấu giá trị cao nhất
            print(row)
        
        print(f"└{'─' * 22}┴{'─' * 18}┴{'─' * 18}┴{'─' * 18}┘")
    
    # Coverage
    print(f"\n┌{'─' * 78}┐")
    print(f"│{'  CATALOG COVERAGE (Độ phủ danh mục)':^78}│")
    print(f"├{'─' * 22}┬{'─' * 54}┤")
    for name in model_names:
        short = name
        cov = all_coverage[name]
        print(f"│ {short:<20} │ {cov:>10.2%}{' ' * 42}│")
    print(f"└{'─' * 22}┴{'─' * 54}┘")


def print_improvement_analysis(all_results, k_values):
    """Phân tích mức cải thiện của Hybrid so với CB và CF riêng lẻ."""
    
    model_names = list(all_results.keys())
    if len(model_names) < 3:
        return
    
    cb_name = model_names[0]  # Content-Based
    cf_name = model_names[1]  # Collaborative
    hy_name = model_names[2]  # Hybrid
    
    metrics = ["Precision@K", "Recall@K", "F1@K", "NDCG@K", "MAP@K", "Hit Rate@K"]
    
    print("\n")
    print("╔" + "═" * 78 + "╗")
    print("║" + "  PHÂN TÍCH CẢI THIỆN CỦA HYBRID SO VỚI CB VÀ CF RIÊNG LẺ".center(78) + "║")
    print("╚" + "═" * 78 + "╝")
    
    for k in k_values:
        print(f"\n  ═══ K = {k} ═══")
        print(f"  {'Metric':<16} │ {'CB → Hybrid':>14} │ {'CF → Hybrid':>14} │ {'Kết luận':<20}")
        print(f"  {'─' * 16}─┼─{'─' * 14}─┼─{'─' * 14}─┼─{'─' * 20}")
        
        for metric in metrics:
            cb_val = all_results[cb_name][k].get(metric, 0.0)
            cf_val = all_results[cf_name][k].get(metric, 0.0)
            hy_val = all_results[hy_name][k].get(metric, 0.0)
            
            # Tính % cải thiện
            if cb_val > 0:
                cb_improvement = ((hy_val - cb_val) / cb_val) * 100
            else:
                cb_improvement = 0.0 if hy_val == 0 else float('inf')
            
            if cf_val > 0:
                cf_improvement = ((hy_val - cf_val) / cf_val) * 100
            else:
                cf_improvement = 0.0 if hy_val == 0 else float('inf')
            
            # Emoji kết luận
            if cb_improvement > 0 and cf_improvement > 0:
                conclusion = "Hybrid wins"
            elif cb_improvement > 0:
                conclusion = "Better than CB"
            elif cf_improvement > 0:
                conclusion = "Better than CF"
            else:
                conclusion = "No improvement"
            
            cb_str = f"{cb_improvement:+.1f}%" if cb_improvement != float('inf') else "+INF"
            cf_str = f"{cf_improvement:+.1f}%" if cf_improvement != float('inf') else "+INF"
            
            print(f"  {metric:<16} │ {cb_str:>14} │ {cf_str:>14} │ {conclusion:<20}")
    
    # Tổng kết
    print(f"\n{'─' * 78}")
    print("  GHI CHÚ:")
    print("  • Giá trị dương (+) = Hybrid tốt hơn model đơn lẻ")
    print("  • Giá trị âm (-)   = Hybrid kém hơn model đơn lẻ")
    print("  • 'Hybrid wins'    = Hybrid vượt trội cả CB lẫn CF")
    print(f"{'─' * 78}")


# =====================================================================
#  MAIN
# =====================================================================

if __name__ == "__main__":
    print()
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║   VioTune Recommendation Evaluation Suite v1.0             ║")
    print("║   Đánh giá so sánh: Content-Based vs CF vs Hybrid          ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()
    
    results, coverage = run_full_evaluation()
    
    print("\n  Đánh giá hoàn tất! Kết quả đã được in ở trên.")
