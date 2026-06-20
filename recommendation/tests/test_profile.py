import os
import sys
import time

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
sys.path.append(os.path.join(parent_dir, "src"))

from src.evaluate import prepare_evaluation_data, hybrid_recommend_for_eval

print("Loading data...")
interactions_path = os.path.join(parent_dir, "data/interactions.csv")
songs_path = os.path.join(parent_dir, "data/dataset.csv")

eval_data, songs_df, all_track_ids = prepare_evaluation_data(
    interactions_path, songs_path, n_holdout=3, min_interactions=5
)

print(f"Loaded {len(eval_data)} users.")
if eval_data:
    item = eval_data[0]
    print(f"Profiling first user: {item['user_id']}")
    
    t0 = time.time()
    res = hybrid_recommend_for_eval(item["user_id"], item["profile_tracks"][:10], item["play_counts"], 5, alpha=0.0)
    t1 = time.time()
    print(f"Alpha=0.0 took {(t1-t0)*1000:.2f} ms. Result: {res}")
    
    t0 = time.time()
    res = hybrid_recommend_for_eval(item["user_id"], item["profile_tracks"][:10], item["play_counts"], 5, alpha=0.5)
    t1 = time.time()
    print(f"Alpha=0.5 took {(t1-t0)*1000:.2f} ms. Result: {res}")
    
    t0 = time.time()
    res = hybrid_recommend_for_eval(item["user_id"], item["profile_tracks"][:10], item["play_counts"], 5, alpha=1.0)
    t1 = time.time()
    print(f"Alpha=1.0 took {(t1-t0)*1000:.2f} ms. Result: {res}")
