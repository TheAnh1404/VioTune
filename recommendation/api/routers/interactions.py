from fastapi import APIRouter, Depends, HTTPException, Query, Request
import datetime
import api.firebase_db as fdb
from api.auth import get_current_user, require_matching_user
from api.db import get_db_connection

router = APIRouter(tags=["Interactions"])

@router.post("/songs/{track_id}/play")
def record_song_play(request: Request, track_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    songs_df = request.app.state.songs_df
    if songs_df[songs_df['track_id'] == track_id].empty:
        raise HTTPException(status_code=404, detail="Song not found")
        
    played_at = datetime.datetime.now().isoformat()
    play_id = f"{user_id}_{track_id}_{int(datetime.datetime.now().timestamp() * 1000)}"
    fdb.set_document("play_history", play_id, {
        "user_id": user_id, "track_id": track_id, "played_at": played_at
    })
    return {"status": "success"}

@router.get("/api/users/{user_id}/taste-profile")
def get_user_taste_profile(request: Request, user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    songs_df = request.app.state.songs_df
    user_likes = request.app.state.user_likes
    
    liked_ids = user_likes.get(user_id, set()).copy()
    try:
        likes = fdb.query_documents("liked_songs", {"user_id": user_id})
        for l in likes: liked_ids.add(l["track_id"])
    except Exception: pass
    
    if not liked_ids:
        return {"status": "success", "data": {"danceability": 0.5, "energy": 0.5, "song_count": 0}}
        
    matched_songs = songs_df[songs_df['track_id'].isin(liked_ids)]
    features = ["danceability", "energy", "acousticness", "instrumentalness", "liveness", "valence", "tempo"]
    res = {f: float(matched_songs[f].mean()) for f in features if f in matched_songs.columns}
    res["song_count"] = len(matched_songs)
    res["favorite_genre"] = str(matched_songs["track_genre"].value_counts().index[0]) if not matched_songs.empty else "Mixed"
    return {"status": "success", "data": res}

@router.get("/songs/liked")
def get_liked_songs(request: Request, user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    liked_ids = request.app.state.user_likes.get(user_id, set()).copy()
    try:
        likes = fdb.query_documents("liked_songs", {"user_id": user_id})
        for l in likes: liked_ids.add(l["track_id"])
    except Exception: pass
    
    if not liked_ids: return {"status": "success", "data": []}
    liked_songs = request.app.state.songs_df[request.app.state.songs_df['track_id'].isin(liked_ids)]
    return {"status": "success", "data": liked_songs[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

@router.post("/songs/{track_id}/like")
def like_song(request: Request, track_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    if request.app.state.songs_df[request.app.state.songs_df['track_id'] == track_id].empty:
        raise HTTPException(status_code=404, detail="Song not found")
    
    liked_at = datetime.datetime.now().isoformat()
    doc_id = f"{user_id}_{track_id}"
    fdb.set_document("liked_songs", doc_id, {"user_id": user_id, "track_id": track_id, "liked_at": liked_at})
    
    conn = get_db_connection()
    conn.execute("INSERT OR IGNORE INTO liked_songs VALUES (?, ?, ?)", (user_id, track_id, liked_at))
    conn.commit()
from fastapi import APIRouter, Depends, HTTPException, Query, Request
import datetime
import api.firebase_db as fdb
from api.auth import get_current_user, require_matching_user
from api.db import get_db_connection

router = APIRouter(tags=["Interactions"])

@router.post("/songs/{track_id}/play")
def record_song_play(request: Request, track_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    songs_df = request.app.state.songs_df
    if songs_df[songs_df['track_id'] == track_id].empty:
        raise HTTPException(status_code=404, detail="Song not found")
        
    played_at = datetime.datetime.now().isoformat()
    play_id = f"{user_id}_{track_id}_{int(datetime.datetime.now().timestamp() * 1000)}"
    fdb.set_document("play_history", play_id, {
        "user_id": user_id, "track_id": track_id, "played_at": played_at
    })
    return {"status": "success"}

@router.get("/api/users/{user_id}/taste-profile")
def get_user_taste_profile(request: Request, user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    songs_df = request.app.state.songs_df
    user_likes = request.app.state.user_likes
    
    liked_ids = user_likes.get(user_id, set()).copy()
    try:
        likes = fdb.query_documents("liked_songs", {"user_id": user_id})
        for l in likes: liked_ids.add(l["track_id"])
    except Exception: pass
    
    if not liked_ids:
        return {"status": "success", "data": {"danceability": 0.5, "energy": 0.5, "song_count": 0}}
        
    matched_songs = songs_df[songs_df['track_id'].isin(liked_ids)]
    features = ["danceability", "energy", "acousticness", "instrumentalness", "liveness", "valence", "tempo"]
    res = {f: float(matched_songs[f].mean()) for f in features if f in matched_songs.columns}
    res["song_count"] = len(matched_songs)
    res["favorite_genre"] = str(matched_songs["track_genre"].value_counts().index[0]) if not matched_songs.empty else "Mixed"
    return {"status": "success", "data": res}

@router.get("/songs/liked")
def get_liked_songs(request: Request, user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    liked_ids = request.app.state.user_likes.get(user_id, set()).copy()
    try:
        likes = fdb.query_documents("liked_songs", {"user_id": user_id})
        for l in likes: liked_ids.add(l["track_id"])
    except Exception: pass
    
    if not liked_ids: return {"status": "success", "data": []}
    liked_songs = request.app.state.songs_df[request.app.state.songs_df['track_id'].isin(liked_ids)]
    return {"status": "success", "data": liked_songs[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}

@router.post("/songs/{track_id}/like")
def like_song(request: Request, track_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    if request.app.state.songs_df[request.app.state.songs_df['track_id'] == track_id].empty:
        raise HTTPException(status_code=404, detail="Song not found")
    
    liked_at = datetime.datetime.now().isoformat()
    doc_id = f"{user_id}_{track_id}"
    fdb.set_document("liked_songs", doc_id, {"user_id": user_id, "track_id": track_id, "liked_at": liked_at})
    
    conn = get_db_connection()
    conn.execute("INSERT OR IGNORE INTO liked_songs VALUES (?, ?, ?)", (user_id, track_id, liked_at))
    conn.commit()
    conn.close()
    
    if user_id not in request.app.state.user_likes: request.app.state.user_likes[user_id] = set()
    request.app.state.user_likes[user_id].add(track_id)
    return {"status": "success", "liked": True}

@router.delete("/songs/{track_id}/like")
def unlike_song(request: Request, track_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    doc_id = f"{user_id}_{track_id}"
    fdb.delete_document("liked_songs", doc_id)
    conn = get_db_connection()
    conn.execute("DELETE FROM liked_songs WHERE user_id = ? AND track_id = ?", (user_id, track_id))
    conn.commit()
    conn.close()
    if user_id in request.app.state.user_likes:
        request.app.state.user_likes[user_id].discard(track_id)
    return {"status": "success", "liked": False}

@router.get("/songs/history")
def get_play_history(request: Request, user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    try:
        # Get from Firestore
        history_docs = fdb.query_documents("play_history", {"user_id": user_id})
        # Sort by played_at descending
        history_docs.sort(key=lambda x: x.get("played_at", ""), reverse=True)
        # Get unique track IDs
        seen = set()
        track_ids = []
        for doc in history_docs:
            tid = doc.get("track_id")
            if tid and tid not in seen:
                seen.add(tid)
                track_ids.append(tid)
                
        if not track_ids:
            return {"status": "success", "data": []}
            
        # Get track details
        songs_df = request.app.state.songs_df
        history_songs = songs_df[songs_df['track_id'].isin(track_ids)]
        # Keep original order
        history_songs = history_songs.set_index('track_id').loc[track_ids].reset_index()
        
        return {"status": "success", "data": history_songs[['track_id', 'track_name', 'artists', 'track_genre', 'popularity']].to_dict(orient="records")}
    except Exception as e:
        print("Error fetching history:", e)
        return {"status": "success", "data": []}
