from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import pandas as pd
import os

from src.hybrid import hybrid_recommend
from src.content_based import recommend as content_recommend
from src.collaborative import recommend_cf

app = FastAPI(title="VioTune API", description="Music Recommendation API", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load metadata for generic endpoints
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dataset_path = os.path.join(current_dir, "data/dataset.csv")

try:
    songs_df = pd.read_csv(dataset_path)
    # Basic cleaning for API usage
    songs_df = songs_df.dropna(subset=["track_id", "track_name", "artists", "track_genre"])
except Exception as e:
    print(f"Error loading dataset: {e}")
    songs_df = pd.DataFrame()

# In-memory database of likes: {user_id: set([track_ids])}
user_likes = {}

@app.get("/")
def home():
    return {"status": "success", "message": "Recommendation API is running 🚀"}

@app.get("/recommend")
def recommend(user_id: int, song_id: str, top_n: int = Query(5, ge=1, le=50)):
    try:
        result = hybrid_recommend(user_id=user_id, song_id=song_id, top_n=top_n)
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
def recommend_collaborative(user_id: int, top_n: int = Query(5, ge=1, le=50)):
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
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    q_lower = q.lower()
    matches = songs_df[
        songs_df['track_name'].str.lower().str.contains(q_lower, na=False) |
        songs_df['artists'].str.lower().str.contains(q_lower, na=False) |
        songs_df['track_genre'].str.lower().str.contains(q_lower, na=False)
    ].head(limit)
    
    return {"status": "success", "data": matches[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

@app.get("/songs/random")
def get_random_songs(limit: int = Query(10, ge=1, le=50)):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    random_songs = songs_df.sample(limit)
    return {"status": "success", "data": random_songs[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

@app.get("/songs/{track_id}")
def get_song(track_id: str):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    song = songs_df[songs_df['track_id'] == track_id]
    if song.empty:
        raise HTTPException(status_code=404, detail="Song not found")
    
    return {"status": "success", "data": song.iloc[0].to_dict()}

@app.get("/genres")
def get_genres():
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    genres = sorted(songs_df['track_genre'].dropna().unique().tolist())
    return {"status": "success", "data": genres}

@app.post("/songs/{track_id}/like")
def toggle_like_song(track_id: str, user_id: int):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    # Check if track exists
    song = songs_df[songs_df['track_id'] == track_id]
    if song.empty:
        raise HTTPException(status_code=404, detail="Song not found")
    
    if user_id not in user_likes:
        user_likes[user_id] = set()
    
    if track_id in user_likes[user_id]:
        user_likes[user_id].remove(track_id)
        liked = False
    else:
        user_likes[user_id].add(track_id)
        liked = True
    
    return {"status": "success", "liked": liked, "message": "Song liked" if liked else "Song unliked"}

@app.get("/songs/liked")
def get_liked_songs(user_id: int):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    liked_ids = list(user_likes.get(user_id, set()))
    if not liked_ids:
        return {"status": "success", "data": []}
    
    liked_songs = songs_df[songs_df['track_id'].isin(liked_ids)]
    return {"status": "success", "data": liked_songs[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

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