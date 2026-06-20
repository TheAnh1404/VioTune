import os
import sys
from dotenv import load_dotenv

# Path configuration
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(current_dir)
load_dotenv(os.path.join(current_dir, ".env"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.database_init import init_db
from api.data_state import load_songs_df, sync_likes_from_db

app = FastAPI(title="VioTune API", description="Modular Music Recommendation API", version="1.1.0")

# 1. Initialize Database & Global State
try:
    init_db(current_dir)
    app.state.songs_df = load_songs_df(current_dir)
    app.state.user_likes = sync_likes_from_db()
except Exception as e:
    print(f"Startup error: {e}")
    app.state.songs_df = None
    app.state.user_likes = {}

# Now import routers, which might load ML models that rely on the DB
from api.routers import users, songs, interactions, recommendations, playlists

# 2. CORS setup
allowed_origins = [
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:3001", "http://127.0.0.1:3001",
    "http://localhost:5000", "http://127.0.0.1:5000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Include Routers
app.include_router(users.router)
app.include_router(interactions.router)
app.include_router(songs.router)
app.include_router(recommendations.router)
app.include_router(playlists.router)

@app.get("/")
def home():
    return {"status": "success", "message": "VioTune Modular API is running 🚀"}

@app.get("/health/live")
def health_live():
    return {"status": "live"}

@app.get("/health/ready")
def health_ready():
    if app.state.songs_df is None or app.state.songs_df.empty:
        raise HTTPException(status_code=503, detail="Catalog not loaded")
    return {"status": "ready", "songs": len(app.state.songs_df)}
