import os
import sys
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Import models
from collaborative import SVDModel, interactions_path, songs_path, models_dir
# We will manually import Annoy logic to avoid re-running it on import if we can

def train_svd():
    print("[Train] Loading interactions for SVD...")
    interactions = pd.read_csv(interactions_path)
    interactions["rating"] = np.log1p(interactions["play_count"])
    
    user_ids = interactions["user_id"].unique()
    track_ids = interactions["track_id"].unique()
    
    user_index = {uid: i for i, uid in enumerate(user_ids)}
    track_index = {tid: i for i, tid in enumerate(track_ids)}
    
    interactions["u_idx"] = interactions["user_id"].map(user_index)
    interactions["i_idx"] = interactions["track_id"].map(track_index)
    
    n_users = len(user_ids)
    n_items = len(track_ids)
    
    train_data, test_data = train_test_split(interactions, test_size=0.2, random_state=42)
    
    print(f"[Train] Training SVD with {n_users} users and {n_items} items...")
    svd = SVDModel(n_users=n_users, n_items=n_items, k=50, lr=0.005, reg=0.02, n_epochs=30)
    svd.fit(train_data, test_data)
    svd.save(models_dir)
    print("[Train] SVD training complete.")

def build_annoy_index():
    print("[Train] Loading songs for Annoy Index...")
    import sqlite3
    db_path = os.path.join(current_dir, "../data/viotune.db")
    try:
        conn = sqlite3.connect(db_path)
        songs = pd.read_sql("SELECT * FROM songs", conn)
        conn.close()
    except Exception:
        songs = pd.read_csv(songs_path)
    
    features = ["danceability", "energy", "acousticness", "instrumentalness", "liveness", "valence", "tempo"]
    songs = songs.dropna(subset=features + ["track_id"])
    songs = songs.reset_index(drop=True)
    
    scaler = MinMaxScaler()
    scaled_features = scaler.fit_transform(songs[features])
    weights = np.array([1.2, 1.1, 0.9, 0.7, 0.6, 1.2, 1.0])
    scaled_features = scaled_features * weights
    
    try:
        from annoy import AnnoyIndex
        print("[Train] Building Annoy Index...")
        annoy_index = AnnoyIndex(7, 'angular')
        for i, vec in enumerate(scaled_features):
            annoy_index.add_item(i, vec)
        annoy_index.build(15)
        
        index_path = os.path.join(models_dir, "content_index.ann")
        annoy_index.save(index_path)
        print(f"[Train] Annoy Index saved to {index_path}")
    except ImportError:
        print("[Train] Annoy package not found, skipping index build.")

if __name__ == "__main__":
    train_svd()
    build_annoy_index()
    print("[Train] All models retrained and saved successfully.")
