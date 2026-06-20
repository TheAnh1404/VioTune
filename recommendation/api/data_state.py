import os
import pandas as pd
from api.db import get_db_connection

def load_songs_df(current_dir):
    try:
        conn = get_db_connection()
        df = pd.read_sql("SELECT * FROM songs", conn)
        conn.close()
        print("Dataset loaded from SQLite successfully.")
        return df
    except Exception as e:
        print(f"Error loading dataset from SQLite: {e}")
        dataset_path = os.path.join(current_dir, "data/dataset.csv")
        if os.path.exists(dataset_path):
            try:
                df = pd.read_csv(dataset_path)
                df = df.dropna(subset=["track_id", "track_name", "artists", "track_genre"])
                if "Unnamed: 0" in df.columns:
                    df = df.drop("Unnamed: 0", axis=1)
                return df
            except Exception as csv_err:
                print(f"Error loading fallback CSV: {csv_err}")
        return pd.DataFrame()

def sync_likes_from_db():
    user_likes = {}
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, track_id FROM liked_songs")
        rows = cursor.fetchall()
        for row in rows:
            uid = row['user_id']
            tid = row['track_id']
            if uid not in user_likes:
                user_likes[uid] = set()
            user_likes[uid].add(tid)
        conn.close()
        print(f"Synced {len(rows)} likes to memory.")
    except Exception as e:
        print(f"Error syncing likes: {e}")
    return user_likes
