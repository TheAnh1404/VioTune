import os
import sys

# Configure UTF-8 encoding for Windows terminals to prevent UnicodeEncodeError
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

from dotenv import load_dotenv

# Load environment variables
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(current_dir)
load_dotenv(os.path.join(current_dir, ".env"))

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import pandas as pd
import numpy as np
import requests
import urllib.parse
import hashlib
import uuid
import datetime

from src.hybrid import hybrid_recommend
from src.content_based import recommend as content_recommend
from src.collaborative import recommend_cf

app = FastAPI(title="VioTune API", description="Music Recommendation API", version="1.0.0")

# Setup environment database paths
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(current_dir, "data/viotune.db")

# Salting and Hashing password helpers using standard hashlib
def hash_password(password: str, salt: str = None) -> str:
    if not salt:
        salt = uuid.uuid4().hex
    hash_val = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return f"{salt}${hash_val}"

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        salt, hash_val = hashed_password.split("$")
        return hash_password(password, salt) == hashed_password
    except Exception:
        return False

# Pydantic Auth Models
class SignupRequest(BaseModel):
    email: str
    password: str
    displayName: str

class SigninRequest(BaseModel):
    email: str
    password: str

class ResetPasswordRequest(BaseModel):
    email: str

# Table Initializer function
def init_db():
    import sqlite3
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            uid TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password_hash TEXT,
            display_name TEXT,
            created_at TEXT
        )
    """)
    # Liked songs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS liked_songs (
            user_id TEXT,
            track_id TEXT,
            liked_at TEXT,
            PRIMARY KEY (user_id, track_id)
        )
    """)
    # Play history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS play_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            track_id TEXT,
            played_at TEXT
        )
    """)
    # Deezer cache table
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
    conn.commit()
    conn.close()

# Initialize SQLite tables
try:
    init_db()
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Error initializing DB tables: {e}")


# CORS setup with environment origin restriction
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

# If wildcard is set or empty, expand to common dev server ports to avoid credentials-CORS exceptions
if "*" in allowed_origins or not allowed_origins:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5000",
        "http://127.0.0.1:5000"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load metadata from SQLite database
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(current_dir, "data/viotune.db")

try:
    import sqlite3
    conn = sqlite3.connect(db_path)
    songs_df = pd.read_sql("SELECT * FROM songs", conn)
    conn.close()
    print("Dataset loaded from SQLite viotune.db successfully.")
except Exception as e:
    print(f"Error loading dataset from SQLite: {e}")
    # Fallback to CSV if DB is not present
    dataset_path = os.path.join(current_dir, "data/dataset.csv")
    if os.path.exists(dataset_path):
        try:
            songs_df = pd.read_csv(dataset_path)
            songs_df = songs_df.dropna(subset=["track_id", "track_name", "artists", "track_genre"])
            if "Unnamed: 0" in songs_df.columns:
                songs_df = songs_df.drop("Unnamed: 0", axis=1)
            print("Dataset loaded from fallback CSV successfully.")
        except Exception as csv_err:
            print(f"Error loading dataset from fallback CSV: {csv_err}")
            songs_df = pd.DataFrame()
    else:
        songs_df = pd.DataFrame()

# In-memory database of likes: {user_id: set([track_ids])}
user_likes = {}

# In-memory Deezer preview URL cache: { 'track_name|artist': result_dict }
_preview_cache: dict = {}

@app.get("/")
def home():
    return {"status": "success", "message": "Recommendation API is running 🚀"}

# --- AUTH ENPOINTS ---
@app.post("/api/auth/signup")
def signup(req: SignupRequest):
    import sqlite3
    import datetime
    import uuid
    
    email = req.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="This email is already registered.")
    
    uid = str(uuid.uuid4())
    password_hash = hash_password(req.password)
    created_at = datetime.datetime.now().isoformat()
    
    cursor.execute(
        "INSERT INTO users (uid, email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)",
        (uid, email, password_hash, req.displayName.strip(), created_at)
    )
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "user": {
            "uid": uid,
            "email": email,
            "displayName": req.displayName.strip()
        }
    }

@app.post("/api/auth/signin")
def signin(req: SigninRequest):
    import sqlite3
    
    email = req.email.strip().lower()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user_row = cursor.fetchone()
    conn.close()
    
    if not user_row:
        raise HTTPException(status_code=400, detail="No account found with this email.")
        
    if not verify_password(req.password, user_row["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect password.")
        
    return {
        "status": "success",
        "user": {
            "uid": user_row["uid"],
            "email": user_row["email"],
            "displayName": user_row["display_name"]
        }
    }

@app.post("/api/auth/reset-password")
def reset_password_route(req: ResetPasswordRequest):
    import sqlite3
    
    email = req.email.strip().lower()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM users WHERE email = ?", (email,))
    user_exists = cursor.fetchone()
    conn.close()
    
    if not user_exists:
        raise HTTPException(status_code=404, detail="No account found with this email.")
        
    return {
        "status": "success",
        "message": "Password reset email simulated successfully."
    }

# --- MUSIC DATA LOGGING & PROFILE ANALYTICS ---
@app.post("/songs/{track_id}/play")
def record_song_play(track_id: str, user_id: str):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    # Check if song exists
    song = songs_df[songs_df['track_id'] == track_id]
    if song.empty:
        raise HTTPException(status_code=404, detail="Song not found")
        
    try:
        import sqlite3
        import datetime
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        played_at = datetime.datetime.now().isoformat()
        cursor.execute("INSERT INTO play_history (user_id, track_id, played_at) VALUES (?, ?, ?)", (user_id, track_id, played_at))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error recording play history: {e}")
        
    return {"status": "success", "message": "Song play recorded"}

@app.get("/api/users/{user_id}/taste-profile")
def get_user_taste_profile(user_id: str):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
        
    # Get liked songs
    liked_ids = set()
    try:
        import sqlite3
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT track_id FROM liked_songs WHERE user_id = ?", (user_id,))
        for row in cursor.fetchall():
            liked_ids.add(row[0])
        conn.close()
    except Exception as e:
        print(f"Error fetching liked songs for profile: {e}")
        
    # Also in-memory
    liked_ids.update(user_likes.get(user_id, set()))
    
    features_list = [
        "danceability",
        "energy",
        "acousticness",
        "instrumentalness",
        "liveness",
        "valence"
    ]
    
    if not liked_ids:
        # Return default averages if no liked songs
        return {
            "status": "success",
            "data": {
                "danceability": 0.5,
                "energy": 0.5,
                "acousticness": 0.5,
                "instrumentalness": 0.2,
                "liveness": 0.2,
                "valence": 0.5,
                "tempo": 120.0,
                "song_count": 0,
                "favorite_genre": "No liked songs yet"
            }
        }
        
    matched_songs = songs_df[songs_df['track_id'].isin(liked_ids)]
    
    # Calculate means
    means = {}
    for f in features_list:
        if f in matched_songs.columns:
            means[f] = float(matched_songs[f].mean())
        else:
            means[f] = 0.5
            
    if "tempo" in matched_songs.columns:
        means["tempo"] = float(matched_songs["tempo"].mean())
    else:
        means["tempo"] = 120.0
        
    means["song_count"] = len(matched_songs)
    
    # Find top favorite genre
    if "track_genre" in matched_songs.columns and not matched_songs.empty:
        top_genre = matched_songs["track_genre"].value_counts().index[0]
        means["favorite_genre"] = str(top_genre)
    else:
        means["favorite_genre"] = "Mixed"
        
    return {"status": "success", "data": means}


def retrain_model_task():
    """
    Tác vụ chạy ngầm để tải dữ liệu tương tác thực tế từ Firestore,
    gộp vào bộ dữ liệu tĩnh, huấn luyện lại toàn bộ ma trận SVD và lưu lại.
    """
    try:
        from src.collaborative import fetch_firestore_interactions, SVDModel, interactions_path, models_dir
        import pandas as pd
        import numpy as np
        
        print("[Retrain Task] Bắt đầu huấn luyện lại mô hình SVD ngầm...")
        # 1. Đọc dữ liệu tương tác gốc
        base_interactions = pd.read_csv(interactions_path)
        base_interactions["user_id"] = base_interactions["user_id"].astype(str)
        
        # 2. Đọc dữ liệu tương tác mới từ Firestore
        firestore_df = fetch_firestore_interactions()
        
        # 3. Gộp dữ liệu
        if not firestore_df.empty:
            combined = pd.concat([base_interactions, firestore_df], ignore_index=True)
            interactions = combined.groupby(["user_id", "track_id"], as_index=False)["play_count"].sum()
        else:
            interactions = base_interactions
            
        interactions["rating"] = np.log1p(interactions["play_count"])
        
        # 4. Cập nhật chỉ mục
        u_ids = interactions["user_id"].unique()
        t_ids = interactions["track_id"].unique()
        
        user_index = {uid: i for i, uid in enumerate(u_ids)}
        track_index = {tid: i for i, tid in enumerate(t_ids)}
        
        interactions["u_idx"] = interactions["user_id"].map(user_index)
        interactions["i_idx"] = interactions["track_id"].map(track_index)
        
        n_users = len(u_ids)
        n_items = len(t_ids)
        
        # 5. Huấn luyện mô hình đầy đủ (30 epochs để tối đa độ chính xác)
        new_svd = SVDModel(n_users=n_users, n_items=n_items, k=50, lr=0.005, reg=0.02, n_epochs=30)
        new_svd.fit(interactions)
        new_svd.save(models_dir)
        
        # 6. Cập nhật đối tượng svd toàn cục trong bộ nhớ
        import src.collaborative as col_mod
        col_mod.svd = new_svd
        col_mod.user_index = user_index
        col_mod.track_index = track_index
        col_mod.index_to_track = {i: tid for tid, i in track_index.items()}
        col_mod.interactions = interactions
        
        print("[Retrain Task] Huấn luyện lại mô hình SVD hoàn tất và đã nạp thành công!")
    except Exception as e:
        print(f"[Retrain Task] Lỗi huấn luyện: {e}")

@app.post("/recommend/retrain")
def trigger_retrain(background_tasks: BackgroundTasks):
    """
    Endpoint kích hoạt huấn luyện lại mô hình SVD bất đồng bộ (chạy ngầm).
    Tránh chặn luồng request và tối ưu hóa tài nguyên.
    """
    background_tasks.add_task(retrain_model_task)
    return {"status": "success", "message": "SVD model retraining triggered in background."}

@app.get("/recommend")
def recommend(user_id: str, song_id: str, top_n: int = Query(5, ge=1, le=50), alpha: float = Query(0.5, ge=0.0, le=1.0)):
    try:
        result = hybrid_recommend(user_id=user_id, song_id=song_id, top_n=top_n, alpha=alpha)
        if isinstance(result, str): # Error message from inner function
            raise HTTPException(status_code=404, detail=result)
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recommend/content")
def recommend_content(song_id: str, top_n: int = Query(5, ge=1, le=50)):
    try:
        result_df = content_recommend(song_id, top_n=top_n)
        if isinstance(result_df, str):
            raise HTTPException(status_code=404, detail=result_df)
        
        result_list = result_df.to_dict(orient="records")
        return {"status": "success", "data": result_list}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommend/cf")
def recommend_collaborative(user_id: str, top_n: int = Query(5, ge=1, le=50)):
    try:
        result_df = recommend_cf(user_id, top_n=top_n)
        if isinstance(result_df, str):
            raise HTTPException(status_code=404, detail=result_df)
        
        result_list = result_df.to_dict(orient="records")
        return {"status": "success", "data": result_list}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/songs/search")
def search_songs(q: str = Query(..., min_length=1), limit: int = Query(10, ge=1, le=50)):
    import sqlite3
    db_path = os.path.join(current_dir, "data/viotune.db")
    
    if not os.path.exists(db_path):
        if songs_df.empty:
            raise HTTPException(status_code=500, detail="Dataset not loaded")
        q_lower = q.lower()
        matches = songs_df[
            songs_df['track_name'].str.lower().str.contains(q_lower, na=False) |
            songs_df['artists'].str.lower().str.contains(q_lower, na=False) |
            songs_df['track_genre'].str.lower().str.contains(q_lower, na=False)
        ].head(limit)
        return {"status": "success", "data": matches[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}
        
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        # High performance query utilizing SQLite indexing and caching LEFT JOIN
        query = """
            SELECT s.track_id, s.track_name, s.artists, s.track_genre, s.popularity, c.cover_url
            FROM songs s
            LEFT JOIN deezer_cache c ON c.cache_key = (LOWER(s.track_name) || '|' || LOWER(s.artists))
            WHERE s.track_name LIKE ? OR s.artists LIKE ? OR s.track_genre LIKE ? 
            LIMIT ?
        """
        search_val = f"%{q}%"
        cursor.execute(query, (search_val, search_val, search_val, limit))
        rows = cursor.fetchall()
        conn.close()
        
        data = []
        for r in rows:
            data.append({
                "track_id": r[0],
                "track_name": r[1],
                "artists": r[2],
                "track_genre": r[3],
                "popularity": r[4],
                "cover_url": r[5]
            })
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/songs/random")
def get_random_songs(limit: int = Query(10, ge=1, le=50)):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    random_songs = songs_df.sample(limit)
    return {"status": "success", "data": random_songs[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

@app.get("/songs/dailypick")
def get_daily_pick(limit: int = Query(5, ge=1, le=20)):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    # Take high-popularity songs and sample them for a daily recommendation feel
    top_songs = songs_df.sort_values(by="popularity", ascending=False).head(50)
    picks = top_songs.sample(min(len(top_songs), limit))
    return {"status": "success", "data": picks[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

@app.get("/songs/liked")
def get_liked_songs(user_id: str):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    # Query from local SQLite liked_songs
    liked_ids = set()
    try:
        import sqlite3
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT track_id FROM liked_songs WHERE user_id = ?", (user_id,))
        for row in cursor.fetchall():
            liked_ids.add(row[0])
        conn.close()
    except Exception as e:
        print(f"Error reading liked songs from DB: {e}")
        
    # Merge with in-memory backup
    liked_ids.update(user_likes.get(user_id, set()))
    
    if not liked_ids:
        return {"status": "success", "data": []}
    
    liked_songs = songs_df[songs_df['track_id'].isin(liked_ids)]
    return {"status": "success", "data": liked_songs[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}


@app.get("/songs/preview")
def get_song_preview_route(track_name: str, artist: str):
    """
    Proxy to Deezer: search by track_name + artist, return a 30s MP3 preview_url.
    Results are cached in a persistent SQLite table to survive server restarts.
    """
    import sqlite3
    db_path = os.path.join(current_dir, "data/viotune.db")
    cache_key = f"{track_name.lower()}|{artist.lower()}"
    
    # 1. Thử lấy từ SQLite cache
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            # Đảm bảo bảng tồn tại
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
            conn.commit()
            
            cursor.execute("SELECT * FROM deezer_cache WHERE cache_key = ?", (cache_key,))
            cached_row = cursor.fetchone()
            conn.close()
            
            if cached_row:
                return {
                    "status": "success",
                    "data": {
                        "preview_url": cached_row["preview_url"],
                        "cover_url": cached_row["cover_url"],
                        "deezer_title": cached_row["deezer_title"],
                        "deezer_artist": cached_row["deezer_artist"],
                        "found": bool(cached_row["found"])
                    }
                }
        except Exception as cache_err:
            print(f"[Deezer Cache] Lỗi đọc cache: {cache_err}")

    # 2. Gọi Deezer API nếu không có trong cache
    import urllib.parse as _urlparse
    query = _urlparse.quote(f"{track_name} {artist}")
    deezer_timeout = int(os.getenv("DEEZER_TIMEOUT", 6))
    deezer_url = f"https://api.deezer.com/search?q={query}&limit=5"

    try:
        resp = requests.get(deezer_url, timeout=deezer_timeout)
        resp.raise_for_status()
        data = resp.json()

        preview_url = None
        cover_url = None
        deezer_title = None
        deezer_artist_name = None

        if data.get("data"):
            for item in data["data"]:
                if item.get("preview"):
                    preview_url = item["preview"]
                    cover_url = item.get("album", {}).get("cover_medium", None)
                    deezer_title = item.get("title", track_name)
                    deezer_artist_name = item.get("artist", {}).get("name", artist)
                    break

        result = {
            "preview_url": preview_url,
            "cover_url": cover_url,
            "deezer_title": deezer_title,
            "deezer_artist": deezer_artist_name,
            "found": preview_url is not None
        }

        # 3. Lưu vào SQLite cache để tái sử dụng
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO deezer_cache 
                    (cache_key, preview_url, cover_url, deezer_title, deezer_artist, found)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (cache_key, preview_url, cover_url, deezer_title, deezer_artist_name, int(preview_url is not None)))
                conn.commit()
                conn.close()
            except Exception as cache_write_err:
                print(f"[Deezer Cache] Lỗi ghi cache: {cache_write_err}")

        return {"status": "success", "data": result}

    except requests.exceptions.Timeout:
        return {"status": "success", "data": {"preview_url": None, "found": False, "error": "Deezer timeout"}}
    except Exception as e:
        return {"status": "success", "data": {"preview_url": None, "found": False, "error": str(e)}}



@app.get("/songs/{track_id}")
def get_song(track_id: str):
    import sqlite3
    db_path = os.path.join(current_dir, "data/viotune.db")
    
    if not os.path.exists(db_path):
        if songs_df.empty:
            raise HTTPException(status_code=500, detail="Dataset not loaded")
        song = songs_df[songs_df['track_id'] == track_id]
        if song.empty:
            raise HTTPException(status_code=404, detail="Song not found")
        return {"status": "success", "data": song.iloc[0].to_dict()}

    try:
        conn = sqlite3.connect(db_path)
        # Configure row factory to return dictionaries
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM songs WHERE track_id = ? LIMIT 1", (track_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Song not found")
            
        return {"status": "success", "data": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/songs/{track_id}/like")
def toggle_like_song(track_id: str, user_id: str):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    # Check if track exists
    song = songs_df[songs_df['track_id'] == track_id]
    if song.empty:
        raise HTTPException(status_code=404, detail="Song not found")
    
    if user_id not in user_likes:
        user_likes[user_id] = set()
    
    import sqlite3
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if already liked
    cursor.execute("SELECT 1 FROM liked_songs WHERE user_id = ? AND track_id = ?", (user_id, track_id))
    row = cursor.fetchone()
    
    if row:
        # Unlike
        cursor.execute("DELETE FROM liked_songs WHERE user_id = ? AND track_id = ?", (user_id, track_id))
        liked = False
        if track_id in user_likes[user_id]:
            user_likes[user_id].remove(track_id)
    else:
        # Like
        import datetime
        liked_at = datetime.datetime.now().isoformat()
        cursor.execute("INSERT INTO liked_songs (user_id, track_id, liked_at) VALUES (?, ?, ?)", (user_id, track_id, liked_at))
        liked = True
        user_likes[user_id].add(track_id)
        
    conn.commit()
    conn.close()
    
    return {"status": "success", "liked": liked, "message": "Song liked" if liked else "Song unliked"}


@app.get("/genres")
def get_genres():
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    genres = sorted(songs_df['track_genre'].dropna().unique().tolist())
    return {"status": "success", "data": genres}

@app.get("/artists")
def get_artists(limit: int = Query(10, ge=1, le=50)):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    # Group by artists and count songs, sort by popularity to get popular artists
    popular_artists = songs_df.groupby('artists')['popularity'].mean().sort_values(ascending=False).head(limit*2).index.tolist()
    # Filter out empty or extremely long names
    popular_artists = [a for a in popular_artists if isinstance(a, str) and len(a) < 30 and len(a) > 2]
    
    # Unique list
    seen = set()
    unique_artists = []
    for a in popular_artists:
        if a.lower() not in seen:
            seen.add(a.lower())
            unique_artists.append(a)
    
    return {"status": "success", "data": unique_artists[:limit]}

@app.get("/playlists")
def get_dynamic_playlists(limit: int = Query(5, ge=1, le=20)):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    genres = songs_df['track_genre'].dropna().unique()
    chosen_genres = np.random.choice(genres, min(len(genres), limit), replace=False)
    playlists = []
    # Curate aesthetic playlists based on unique genres
    playlist_covers = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
        "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=400",
        "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400",
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
        "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400"
    ]
    for i, genre in enumerate(chosen_genres):
        count = len(songs_df[songs_df['track_genre'] == genre])
        cover = playlist_covers[i % len(playlist_covers)]
        playlists.append({
            "id": i + 1,
            "name": f"Best of {genre.capitalize()}",
            "tracks": min(count, 50),
            "genre": genre,
            "imageUrl": cover
        })
    return {"status": "success", "data": playlists}

@app.get("/playlists/{genre}/songs")
def get_playlist_songs(genre: str, limit: int = Query(15, ge=1, le=50)):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    genre_songs = songs_df[songs_df['track_genre'].str.lower() == genre.lower()].head(limit)
    return {"status": "success", "data": genre_songs[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

@app.get("/albums")
def get_mock_albums(limit: int = Query(5, ge=1, le=20)):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    # Take high-popularity artists to simulate compilation albums
    artists = songs_df.groupby('artists')['popularity'].mean().sort_values(ascending=False).head(20).index.tolist()
    chosen_artists = np.random.choice(artists, min(len(artists), limit), replace=False)
    albums = []
    album_covers = [
        "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=400",
        "https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400",
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
        "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400"
    ]
    for i, artist in enumerate(chosen_artists):
        cover = album_covers[i % len(album_covers)]
        albums.append({
            "id": i + 1,
            "title": f"{artist}'s Anthology",
            "artist": artist,
            "imageUrl": cover
        })
    return {"status": "success", "data": albums}