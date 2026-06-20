from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional
import datetime
import api.firebase_db as fdb
from api.auth import get_current_user, get_current_uid
from api.db import get_db_connection

router = APIRouter(prefix="/api/users", tags=["Users"])

class UserSyncRequest(BaseModel):
    displayName: Optional[str] = None

@router.put("/me")
def sync_user_profile(req: UserSyncRequest, current_user: dict = Depends(get_current_user)):
    uid = get_current_uid(current_user)
    email = str(current_user.get("email", "")).strip().lower()
    existing_user = fdb.get_document("users", uid) or {}
    created_at = existing_user.get("created_at", datetime.datetime.now().isoformat())
    display_name = (req.displayName or current_user.get("name") or "VioTune User").strip()

    conn = get_db_connection()
    if email:
        conn.execute(
            "UPDATE users SET email = NULL WHERE email = ? AND uid <> ?",
            (email, uid),
        )
    conn.execute(
        """
        INSERT INTO users (uid, email, display_name, created_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(uid) DO UPDATE SET
            email = excluded.email,
            display_name = excluded.display_name
        """,
        (uid, email or None, display_name, created_at),
    )
    conn.commit()
    conn.close()

    fdb.set_document("users", uid, {
        "uid": uid,
        "email": email,
        "display_name": display_name,
        "created_at": created_at
    })

    return {
        "status": "success",
        "user": {
            "uid": uid,
            "email": email,
            "displayName": display_name
        }
    }
