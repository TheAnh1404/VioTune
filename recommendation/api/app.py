from fastapi import FastAPI
from src.hybrid import hybrid_recommend

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Recommendation API is running 🚀"}

@app.get("/recommend")
def recommend(user_id: int, song_id: str):
    result = hybrid_recommend(user_id=user_id, song_id=song_id)
    return result

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)