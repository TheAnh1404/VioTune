import os
import pandas as pd
from api.db import get_db_connection

def init_db(current_dir):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            uid TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            display_name TEXT,
            created_at TEXT
        )
    """)
    
    # 2. Songs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS songs (
            track_id TEXT PRIMARY KEY,
            artists TEXT,
            album_name TEXT,
            track_name TEXT,
            popularity INTEGER,
            duration_ms INTEGER,
            explicit INTEGER,
            danceability REAL,
            energy REAL,
            key INTEGER,
            loudness REAL,
            mode INTEGER,
            speechiness REAL,
            acousticness REAL,
            instrumentalness REAL,
            liveness REAL,
            valence REAL,
            tempo REAL,
            time_signature INTEGER,
            track_genre TEXT
        )
    """)
    
    # 3. Liked songs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS liked_songs (
            user_id TEXT,
            track_id TEXT,
            liked_at TEXT,
            PRIMARY KEY (user_id, track_id),
            FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE,
            FOREIGN KEY (track_id) REFERENCES songs(track_id) ON DELETE CASCADE
        )
    """)
    
    # 4. Play history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS play_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            track_id TEXT,
            played_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE,
            FOREIGN KEY (track_id) REFERENCES songs(track_id) ON DELETE CASCADE
        )
    """)
    
    # 5. Deezer cache table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS deezer_cache (
            cache_key TEXT PRIMARY KEY,
            preview_url TEXT,
            cover_url TEXT,
            deezer_title TEXT,
            deezer_artist TEXT,
            found INTEGER
        )
    """)
    
    # 6. Playlists table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS playlists (
            playlist_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE
        )
    """)
    
    # 7. Playlist tracks table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS playlist_tracks (
            playlist_id TEXT,
            track_id TEXT,
            added_at TEXT NOT NULL,
            PRIMARY KEY (playlist_id, track_id),
            FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) ON DELETE CASCADE,
            FOREIGN KEY (track_id) REFERENCES songs(track_id) ON DELETE CASCADE
        )
    """)
    
    # 8. Create optimized indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_liked_user_track ON liked_songs(user_id, track_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_user ON play_history(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_deezer_cache_key ON deezer_cache(cache_key);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_playlist_user ON playlists(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_playlist_track ON playlist_tracks(playlist_id, track_id);")

    cursor.execute("SELECT COUNT(*) FROM songs")
    if cursor.fetchone()[0] == 0:
        dataset_path = os.path.join(current_dir, "data/dataset.csv")
        if not os.path.exists(dataset_path):
            raise RuntimeError("Song catalog is empty and data/dataset.csv is missing.")

        dataset = pd.read_csv(dataset_path)
        dataset = dataset.dropna(subset=["track_id", "track_name", "artists", "track_genre"])
        dataset = dataset.drop_duplicates(subset=["track_id"])
        if "Unnamed: 0" in dataset.columns:
            dataset = dataset.drop("Unnamed: 0", axis=1)
        dataset.to_sql("songs", conn, if_exists="append", index=False)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_track_name ON songs(track_name);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_artists ON songs(artists);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_track_genre ON songs(track_genre);")
        print(f"Bootstrapped {len(dataset)} songs from dataset.csv.")

    conn.commit()
    conn.close()
