from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import pandas as pd
import numpy as np
import os
import requests
import urllib.parse

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

# In-memory Deezer preview URL cache: { 'track_name|artist': result_dict }
_preview_cache: dict = {}

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

@app.get("/songs/dailypick")
def get_daily_pick(limit: int = Query(5, ge=1, le=20)):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    # Take high-popularity songs and sample them for a daily recommendation feel
    top_songs = songs_df.sort_values(by="popularity", ascending=False).head(50)
    picks = top_songs.sample(min(len(top_songs), limit))
    return {"status": "success", "data": picks[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

@app.get("/songs/liked")
def get_liked_songs(user_id: int):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    liked_ids = list(user_likes.get(user_id, set()))
    if not liked_ids:
        return {"status": "success", "data": []}
    
    liked_songs = songs_df[songs_df['track_id'].isin(liked_ids)]
    return {"status": "success", "data": liked_songs[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

@app.get("/songs/preview")
def get_song_preview_route(track_name: str, artist: str):
    """
    Proxy to Deezer: search by track_name + artist, return a 30s MP3 preview_url.
    Results are cached in-memory to avoid repeated external calls.
    """
    cache_key = f"{track_name.lower()}|{artist.lower()}"
    if cache_key in _preview_cache:
        return {"status": "success", "data": _preview_cache[cache_key]}

    import urllib.parse as _urlparse
    query = _urlparse.quote(f"{track_name} {artist}")
    deezer_url = f"https://api.deezer.com/search?q={query}&limit=5"

    try:
        resp = requests.get(deezer_url, timeout=6)
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
        _preview_cache[cache_key] = result
        return {"status": "success", "data": result}

    except requests.exceptions.Timeout:
        return {"status": "success", "data": {"preview_url": None, "found": False, "error": "Deezer timeout"}}
    except Exception as e:
        return {"status": "success", "data": {"preview_url": None, "found": False, "error": str(e)}}



@app.get("/songs/{track_id}")
def get_song(track_id: str):
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    song = songs_df[songs_df['track_id'] == track_id]
    if song.empty:
        raise HTTPException(status_code=404, detail="Song not found")
    
    return {"status": "success", "data": song.iloc[0].to_dict()}

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