# VioTune: Intelligent Music Discovery & Recommendation Platform

VioTune is a state-of-the-art music streaming and discovery application powered by a sophisticated hybrid recommendation engine. It combines the strengths of **Collaborative Filtering** and **Content-Based Filtering** to deliver hyper-personalized music experiences.

## 🚀 Key Features

- **Hybrid Recommendation Engine**: Seamlessly blends SVD-based collaborative filtering with KNN-driven content analysis for superior accuracy.
- **Dynamic Discovery**: Interactive sections including "Daily Pick," "Trending Now," and "Artist Updates."
- **Immersive UI**: A modern, glassmorphic React-based dashboard designed for high engagement.
- **Cross-Service Communication**: High-performance API integration between a React frontend and a FastAPI backend.
- **Rich Analytics**: Smart genre detection and artist-followed tracking.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) (Functional Components, Hooks)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Styling**: CSS Modules (Scoped, maintainable styling)

### Backend (Recommendation Engine)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous, High Performance)
- **Data Processing**: Pandas, NumPy
- **Machine Learning**: Scikit-learn (Cosine Similarity, KNN), Surprise (SVD Matrix Factorization)
- **Deployment**: Uvicorn

---

## 🧠 Recommendation Logic: The Hybrid Approach

VioTune utilizes a **weighted Reciprocal Rank Scoring (RRS)** system to merge predictions from two distinct models:

1.  **Collaborative Filtering (CF)**: Analyzes user-item interaction patterns using **SVD Matrix Factorization** to find hidden preferences based on similar users.
2.  **Content-Based Filtering (CBF)**: Uses **K-Nearest Neighbors (KNN)** and **Cosine Similarity** to recommend songs with similar acoustic features (genre, artists, tempo, etc.).

The results are combined using a dynamic weight factor ($\alpha$), ensuring the system works perfectly for both existing users and new "cold start" scenarios.

---

## 📂 Project Structure

```text
VioTune/
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Atomic UI components
│   │   ├── pages/          # Main views (HomePage, etc.)
│   │   └── assets/         # Static media assets
│   └── package.json
├── recommendation/         # Python Recommendation Service
│   ├── api/                # FastAPI Endpoints
│   ├── src/                # Recommendation Algorithms (Hybrid, CF, Content)
│   ├── data/               # Dataset storage
│   ├── models/             # Pre-trained ML models
│   └── requirements.txt
└── README.md
```

---

## ⚡ How to Build & Run (Hướng dẫn khởi chạy dự án)

Dưới đây là hướng dẫn chi tiết để thiết lập và khởi chạy cả Backend (FastAPI) và Frontend (React) trên máy tính của bạn (đặc biệt tối ưu hóa cho hệ điều hành Windows).

---

### 1. Khởi chạy Backend (Recommendation Service)

Dự án sử dụng môi trường ảo Python (`.venv`) đặt ở thư mục gốc của project để quản lý các thư viện.

#### Bước 1: Mở Terminal và di chuyển vào thư mục backend
```bash
cd recommendation
```

#### Bước 2: Kích hoạt môi trường ảo (Python Virtual Environment)
Tùy thuộc vào Command Line bạn đang sử dụng trên Windows, hãy chọn lệnh tương ứng:

*   **Nếu dùng PowerShell (Khuyên dùng)**:
    ```powershell
    ..\.venv\Scripts\Activate.ps1
    ```
    *(Lưu ý: Nếu PowerShell báo lỗi Execution Policy, hãy chạy lệnh `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` trước).*
    
*   **Nếu dùng Command Prompt (cmd)**:
    ```cmd
    ..\.venv\Scripts\activate.bat
    ```
    
*   **Nếu dùng Git Bash / Linux / macOS**:
    ```bash
    source ../.venv/bin/activate
    ```

#### Bước 3: Cài đặt các thư viện (chỉ thực hiện lần đầu tiên)
```bash
pip install -r requirements.txt
```

#### Bước 4: Khởi chạy FastAPI Server
*   **Nếu đã kích hoạt môi trường ảo**:
    ```bash
    uvicorn api.app:app --reload
    ```
*   **Hoặc có thể chạy trực tiếp (không cần kích hoạt môi trường ảo)**:
    ```powershell
    ..\.venv\Scripts\uvicorn api.app:app --reload
    ```

*Khi khởi chạy thành công, API backend sẽ hoạt động tại địa chỉ: `http://127.0.0.1:8000`*

---

### 2. Khởi chạy Frontend (React Application)

#### Bước 1: Mở một cửa sổ Terminal mới và di chuyển vào thư mục frontend
```bash
cd frontend
```

#### Bước 2: Cài đặt các thư viện phụ thuộc (chỉ thực hiện lần đầu tiên)
```bash
npm install
```

#### Bước 3: Khởi chạy React Development Server
```bash
npm start
```

*Khi khởi chạy thành công, ứng dụng web sẽ tự động mở trên trình duyệt tại địa chỉ: `http://localhost:3000`*

---

## 🛡️ Best Practices & Design Principles
- **Scalability**: Decoupled frontend and backend for independent scaling.
- **Maintainability**: Component-driven architecture in React and modular algorithm design in Python.
- **Performance**: Optimized matrix operations for near-instant recommendations.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---

**Developed with ❤️ by VioTune Team**