from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from typing import Optional
from pydantic import BaseModel
from src.hybrid import hybrid_recommend
from src.content_based import recommend_multi as content_recommend_multi
from src.collaborative import recommend_cf
from api.auth import get_current_user, require_matching_user, require_admin

router = APIRouter(prefix="/recommend", tags=["Recommendations"])

class RecommendRequest(BaseModel):
    user_id: str
    song_id: str
    top_n: Optional[int] = 5
    alpha: Optional[float] = 0.5

@router.get("")
def recommend(user_id: str, song_id: str, top_n: int = Query(5, ge=1, le=50), alpha: float = Query(0.5, ge=0.0, le=1.0), discovery_mode: bool = Query(False), current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    song_ids = [s.strip() for s in song_id.split(",") if s.strip()]
    result = hybrid_recommend(user_id=user_id, song_ids=song_ids, top_n=top_n, alpha=alpha, discovery_mode=discovery_mode)
    if isinstance(result, str): raise HTTPException(status_code=404, detail=result)
    return {"status": "success", "data": result}

@router.get("/content")
def recommend_content(song_id: str, top_n: int = Query(5, ge=1, le=50), user_id: Optional[str] = Query(None), discovery_mode: bool = Query(False)):
    song_ids = [s.strip() for s in song_id.split(",") if s.strip()]
    result_df = content_recommend_multi(song_ids, top_n=top_n, user_id=user_id, discovery_mode=discovery_mode)
    if isinstance(result_df, str): raise HTTPException(status_code=404, detail=result_df)
    return {"status": "success", "data": result_df.to_dict(orient="records")}

@router.get("/cf")
def recommend_collaborative(user_id: str, top_n: int = Query(5, ge=1, le=50), discovery_mode: bool = Query(False), current_user: dict = Depends(get_current_user)):
    user_id = require_matching_user(user_id, current_user)
    result_df = recommend_cf(user_id, top_n=top_n, discovery_mode=discovery_mode)
    if isinstance(result_df, str): raise HTTPException(status_code=404, detail=result_df)
    return {"status": "success", "data": result_df.to_dict(orient="records")}

def retrain_model_task():
    try:
        from src.collaborative import fetch_firestore_interactions, SVDModel, interactions_path, models_dir
        import pandas as pd
        import numpy as np
        print("[Retrain Task] Starting...")
        base_interactions = pd.read_csv(interactions_path)
        firestore_df = fetch_firestore_interactions()
        interactions = pd.concat([base_interactions, firestore_df], ignore_index=True) if not firestore_df.empty else base_interactions
        interactions = interactions.groupby(["user_id", "track_id"], as_index=False)["play_count"].sum()
        interactions["rating"] = np.log1p(interactions["play_count"])
        
        u_ids, t_ids = interactions["user_id"].unique(), interactions["track_id"].unique()
        user_index = {uid: i for i, uid in enumerate(u_ids)}
        track_index = {tid: i for i, tid in enumerate(t_ids)}
        interactions["u_idx"], interactions["i_idx"] = interactions["user_id"].map(user_index), interactions["track_id"].map(track_index)
        
        new_svd = SVDModel(n_users=len(u_ids), n_items=len(t_ids), k=50)
        new_svd.fit(interactions)
        new_svd.save(models_dir)
        
        import src.collaborative as col_mod
        col_mod.svd, col_mod.user_index, col_mod.track_index = new_svd, user_index, track_index
        col_mod.index_to_track = {i: tid for tid, i in track_index.items()}
        print("[Retrain Task] Completed.")
    except Exception as e: print(f"[Retrain Task] Error: {e}")

@router.post("/retrain")
def trigger_retrain(background_tasks: BackgroundTasks, _admin: dict = Depends(require_admin)):
    background_tasks.add_task(retrain_model_task)
    return {"status": "success", "message": "Retraining triggered."}
