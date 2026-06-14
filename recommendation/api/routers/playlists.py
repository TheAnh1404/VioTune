from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import uuid
import datetime
import api.firebase_db as fdb
from api.auth import get_current_user, require_matching_user

router = APIRouter(tags=["Playlists"])

class CreatePlaylistRequest(BaseModel):
    user_id: str
    name: str
    description: Optional[str] = None

class AddPlaylistSongRequest(BaseModel):
    track_id: str

@router.post("/playlists")
def create_playlist(req: CreatePlaylistRequest, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(req.user_id, current_user)
    playlist_id = str(uuid.uuid4())
    data = {
        "playlist_id": playlist_id, "user_id": user_id, "name": req.name.strip(),
        "description": req.description, "created_at": datetime.datetime.now().isoformat()
    }
    fdb.set_document("playlists", playlist_id, data)
    return {"status": "success", "data": data}

@router.get("/users/{user_id}/playlists")
def get_user_playlists(user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    rows = fdb.query_documents("playlists", {"user_id": user_id}, order_by="created_at", direction="DESCENDING")
    return {"status": "success", "data": rows}

@router.post("/playlists/{playlist_id}/songs")
def add_song_to_playlist(request: Request, playlist_id: str, req: AddPlaylistSongRequest, current_user: dict = Depends(get_current_user)):
    playlist = fdb.get_document("playlists", playlist_id)
    if not playlist: raise HTTPException(status_code=404)
    require_matching_user(playlist["user_id"], current_user)
    
    if request.app.state.songs_df[request.app.state.songs_df['track_id'] == req.track_id].empty:
        raise HTTPException(status_code=404)
        
    doc_id = f"{playlist_id}_{req.track_id}"
    fdb.set_document("playlist_tracks", doc_id, {
        "playlist_id": playlist_id, "track_id": req.track_id, "added_at": datetime.datetime.now().isoformat()
    })
    return {"status": "success"}

@router.get("/playlists/{playlist_id}/songs")
def get_playlist_songs(request: Request, playlist_id: str, current_user: dict = Depends(get_current_user)):
    playlist = fdb.get_document("playlists", playlist_id)
    if not playlist: raise HTTPException(status_code=404)
    require_matching_user(playlist["user_id"], current_user)
    
    rows = fdb.query_documents("playlist_tracks", {"playlist_id": playlist_id}, order_by="added_at")
    songs_df = request.app.state.songs_df
    data = []
    for r in rows:
        track_id = r["track_id"]
        s = songs_df[songs_df['track_id'] == track_id]
        if not s.empty:
            row = s.iloc[0]
            data.append({"track_id": track_id, "track_name": row["track_name"], "artists": row["artists"], "added_at": r["added_at"]})
    return {"status": "success", "playlist": playlist, "data": data}
