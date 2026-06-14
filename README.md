# 🎵 VioTune: Intelligent Music Discovery & Recommendation Platform

VioTune là một nền tảng streaming và khám phá âm nhạc thông minh, sử dụng hệ thống gợi ý lai (Hybrid Recommendation Engine) để mang lại trải nghiệm cá nhân hóa tối ưu cho người dùng. Dự án kết hợp sức mạnh của **React 19** ở Frontend và **FastAPI** ở Backend.

---

## 🚀 Tính năng nổi bật (Key Features)

- **Hệ thống gợi ý lai (Hybrid Engine)**: Kết hợp Collaborative Filtering (SVD) và Content-Based Filtering (KNN) để đưa ra gợi ý chính xác ngay cả với người dùng mới.
- **Khám phá đa dạng**: Các mục "Daily Pick", "Trending Now", và "Artist Updates" được cập nhật liên tục.
- **Trình phát nhạc hiện đại**: Giao diện Glassmorphism tích hợp Visualizer và Acoustic DNA Radar.
- **Tìm kiếm thông minh**: Hỗ trợ tìm kiếm bài hát, nghệ sĩ và thể loại với hiệu năng cao nhờ SQLite indexing.
- **Đồng bộ hóa Cloud**: Lưu trữ playlist, lịch sử nghe nhạc và sở thích người dùng thông qua Firebase/Firestore.
- **Tích hợp Deezer**: Tự động lấy Preview nhạc (30s) và ảnh bìa album chất lượng cao từ Deezer API.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### Frontend
- **Framework**: React 19 (Functional Components, Hooks)
- **State Management**: Context API (`AuthContext`, `PlaybackContext`)
- **UI/UX**: CSS Modules, Lucide Icons, Recharts (Acoustic Radar)
- **Auth**: Custom logic tích hợp Firebase Authentication.

### Backend (Recommendation & API)
- **Framework**: FastAPI (Python 3.10+) - Kiến trúc Modular với APIRouter.
- **Database**: 
    - **SQLite**: Local caching (Deezer previews) và metadata storage.
    - **Firestore**: Lưu trữ dữ liệu người dùng realtime.
- **Machine Learning**: 
    - **Scikit-learn**: KNN cho Content-Based Filtering.
    - **Surprise**: SVD Matrix Factorization cho Collaborative Filtering.
- **Server**: Uvicorn.

---

## 🧠 Logic gợi ý (Recommendation Logic)

VioTune sử dụng thuật toán **Weighted Reciprocal Rank Scoring (RRS)** để gộp kết quả:

1.  **Collaborative Filtering (CF)**: Dự đoán sở thích dựa trên hành vi của các người dùng tương tự thông qua ma trận SVD.
2.  **Content-Based Filtering (CBF)**: Tính toán độ tương đồng giữa các bài hát dựa trên đặc trưng âm học (Acoustic features) như *danceability, energy, tempo, valence...*
3.  **Hybrid Logic**: Kết quả cuối cùng là sự kết hợp theo trọng số $\alpha$:
    $$Score = \alpha \cdot Score_{CBF} + (1 - \alpha) \cdot Score_{CF}$$
    *Trong đó $\alpha$ có thể điều chỉnh để ưu tiên khám phá nhạc mới hoặc bám sát sở thích cũ.*

---

## 📂 Cấu trúc dự án (Project Structure)

```text
VioTune/
├── frontend/                   # React Application
│   ├── src/
│   │   ├── components/         # UI Components modular (Header, Player, etc.)
│   │   ├── context/            # Auth & Playback state
│   │   ├── pages/              # Các view chính (Home, Search, Artist...)
│   │   └── api.js              # Cấu hình Fetch & Auth Interceptor
├── recommendation/             # Backend Service (FastAPI)
│   ├── api/
│   │   ├── routers/            # Các module API riêng biệt (Users, Songs, etc.)
│   │   ├── app.py              # File chạy chính (Modularized)
│   │   └── database_init.py    # Khởi tạo SQLite
│   ├── src/                    # Thuật toán ML Core
│   │   ├── collaborative.py    # SVD Implementation
│   │   ├── content_based.py    # KNN Similarity logic
│   │   └── hybrid.py           # Logic gộp Hybrid
│   ├── data/                   # Dataset & SQLite DB
│   └── models/                 # Serialized ML models (.pkl)
├── DEPLOYMENT.md               # Hướng dẫn triển khai Production
└── GEMINI.md                   # Tài liệu hướng dẫn cho AI/Dev
```

---

## ⚡ Hướng dẫn cài đặt (Installation & Setup)

### 1. Cấu hình Backend (FastAPI)

1.  Di chuyển vào thư mục backend: `cd recommendation`
2.  Kích hoạt môi trường ảo:
    - PowerShell: `..\.venv\Scripts\Activate.ps1`
    - CMD: `..\.venv\Scripts\activate.bat`
    - Linux/macOS: `source ../.venv/bin/activate`
3.  Cài đặt thư viện: `pip install -r requirements.txt`
4.  Chạy Server: `uvicorn api.app:app --reload`
    *(API sẽ chạy tại `http://localhost:8000`)*

### 2. Cấu hình Frontend (React)

1.  Di chuyển vào thư mục frontend: `cd frontend`
2.  Cài đặt dependencies: `npm install`
3.  Chạy ứng dụng: `npm start`
    *(Ứng dụng sẽ chạy tại `http://localhost:3000`)*

---

## 🛡️ Security & Environment
- Đảm bảo bạn đã cấu hình các file `.env` trong cả hai thư mục `frontend/` và `recommendation/`.
- Backend sử dụng Firebase Admin SDK, yêu cầu file credential `.json` (được cấu hình qua biến môi trường).

---

## 📄 License
Project này được cấp phép dưới quyền MIT License.

---
**Developed with ❤️ by VioTune Team**
