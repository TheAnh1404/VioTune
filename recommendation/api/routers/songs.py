from fastapi import APIRouter, HTTPException, Query, Request
import requests
import os
import urllib.parse
from api.db import get_db_connection

router = APIRouter(tags=["Songs"])

@router.get("/songs/search")
def search_songs(request: Request, q: str = Query(..., min_length=1), limit: int = Query(10, ge=1, le=50)):
    songs_df = request.app.state.songs_df
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
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
        raise HTTPException(status_code=500, detail="Internal server error.") from e

@router.get("/artists/{artist_name}/tracks")
def get_artist_tracks(request: Request, artist_name: str, limit: int = Query(30, ge=1, le=100)):
    if request.app.state.songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            SELECT s.track_id, s.track_name, s.artists, s.track_genre, s.popularity, 
                   s.danceability, s.energy, s.acousticness, s.valence, s.tempo, c.cover_url
            FROM songs s
            LEFT JOIN deezer_cache c ON c.cache_key = (LOWER(s.track_name) || '|' || LOWER(s.artists))
            WHERE s.artists LIKE ?
            ORDER BY s.popularity DESC
            LIMIT ?
        """
        search_val = f"%{artist_name}%"
        cursor.execute(query, (search_val, limit))
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
                "danceability": r[5],
                "energy": r[6],
                "acousticness": r[7],
                "valence": r[8],
                "tempo": r[9],
                "cover_url": r[10]
            })
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error.") from e

@router.get("/songs/random")
def get_random_songs(request: Request, limit: int = Query(10, ge=1, le=50)):
    songs_df = request.app.state.songs_df
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    random_songs = songs_df.sample(limit)
    return {"status": "success", "data": random_songs[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

@router.get("/songs/dailypick")
def get_daily_pick(request: Request, limit: int = Query(5, ge=1, le=20)):
    songs_df = request.app.state.songs_df
    if songs_df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    top_songs = songs_df.sort_values(by="popularity", ascending=False).head(50)
    picks = top_songs.sample(min(len(top_songs), limit))
    return {"status": "success", "data": picks[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

@router.get("/songs/preview")
def get_song_preview_route(track_name: str, artist: str):
    cache_key = f"{track_name.lower()}|{artist.lower()}"
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM deezer_cache WHERE cache_key = ?", (cache_key,))
        cached_row = cursor.fetchone()
        conn.close()
        if cached_row:
            return {"status": "success", "data": {
                "preview_url": cached_row["preview_url"],
                "cover_url": cached_row["cover_url"],
                "deezer_title": cached_row["deezer_title"],
                "deezer_artist": cached_row["deezer_artist"],
                "found": bool(cached_row["found"])
            }}
    except Exception: pass

    query = urllib.parse.quote(f"{track_name} {artist}")
    deezer_url = f"https://api.deezer.com/search?q={query}&limit=5"
    try:
        resp = requests.get(deezer_url, timeout=6)
        data = resp.json()
        preview_url, cover_url, d_title, d_artist = None, None, None, None
        if data.get("data"):
            item = data["data"][0]
            preview_url = item.get("preview")
            cover_url = item.get("album", {}).get("cover_medium")
            d_title = item.get("title")
            d_artist = item.get("artist", {}).get("name")
        
        conn = get_db_connection()
        conn.execute("INSERT OR REPLACE INTO deezer_cache VALUES (?, ?, ?, ?, ?, ?)",
                     (cache_key, preview_url, cover_url, d_title, d_artist, int(preview_url is not None)))
        conn.commit()
        conn.close()
        return {"status": "success", "data": {"preview_url": preview_url, "cover_url": cover_url, "found": preview_url is not None}}
    except Exception:
        return {"status": "success", "data": {"preview_url": None, "found": False}}

@router.get("/songs/{track_id}")
def get_song(track_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM songs WHERE track_id = ? LIMIT 1", (track_id,))
        row = cursor.fetchone()
        conn.close()
        if not row: raise HTTPException(status_code=404, detail="Song not found")
        return {"status": "success", "data": dict(row)}
    except Exception: raise HTTPException(status_code=500)

@router.get("/genres")
def get_genres(request: Request):
    df = request.app.state.songs_df
    genres = sorted(df['track_genre'].dropna().unique().tolist())
    return {"status": "success", "data": genres}
