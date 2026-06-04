# VioTune: Intelligent Music Discovery & Recommendation Platform

VioTune is a music streaming and discovery application featuring a hybrid recommendation engine. It integrates a React frontend with a FastAPI backend, utilizing machine learning to provide personalized music experiences.

## 🚀 Project Overview

- **Purpose**: Personalized music discovery using hybrid recommendation strategies.
- **Architecture**: Decoupled React frontend and FastAPI backend.
- **Recommendation Engine**:
    - **Collaborative Filtering**: SVD Matrix Factorization for user-item interaction analysis.
    - **Content-Based Filtering**: KNN and Cosine Similarity for acoustic feature analysis.
    - **Hybrid Logic**: Weighted Reciprocal Rank Scoring (RRS) combining both models.
- **Data Storage**:
    - **SQLite**: Local metadata storage (`viotune.db`) and Deezer API cache.
    - **Firestore**: Remote storage for user profiles, liked songs, and play history.
    - **Deezer API**: Used for fetching song previews (30s) and cover art.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Functional Components, Hooks)
- **State Management**: Context API (`AuthContext`, `PlaybackContext`)
- **Routing**: React Router DOM v7
- **Styling**: CSS Modules
- **Icons**: Lucide React
- **Auth**: Custom logic integrated with Firestore (Firebase SDK also present in dependencies).

### Backend
- **Framework**: FastAPI (Asynchronous Python)
- **Data Analysis**: Pandas, NumPy
- **Machine Learning**: Scikit-learn, Surprise
- **Database**: SQLite (via `sqlite3`), Google Cloud Firestore
- **Server**: Uvicorn

## 📂 Key Directories

- `frontend/`: React application.
    - `src/components/`: Modular UI components.
    - `src/pages/`: Main view components (Home, Search, Player, etc.).
    - `src/context/`: Global state providers.
- `recommendation/`: Python recommendation service.
    - `api/`: FastAPI application, endpoints, and database connection logic.
    - `src/`: Implementation of recommendation algorithms (Hybrid, Collaborative, Content-Based).
    - `data/`: Datasets and local SQLite database.
    - `models/`: Serialized machine learning models.

## ⚡ Building and Running

### Backend (Recommendation Service)
1.  Navigate to `recommendation/`.
2.  Activate Python Virtual Environment:
    *   **PowerShell (Windows)**:
        ```powershell
        ..\.venv\Scripts\Activate.ps1
        ```
    *   **Command Prompt (Windows)**:
        ```cmd
        ..\.venv\Scripts\activate.bat
        ```
    *   **Git Bash / macOS / Linux**:
        ```bash
        source ../.venv/bin/activate
        ```
3.  Install dependencies (first time only):
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the server:
    *   **If activated**: `uvicorn api.app:app --reload`
    *   **Direct command**: `..\.venv\Scripts\uvicorn api.app:app --reload`
    *The API will be available at `http://127.0.0.1:8000` by default.*

### Frontend (React App)
1.  Navigate to `frontend/`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```
    *The app will be available at `http://localhost:3000`.*

## 🧪 Testing
- **Frontend**: `npm test` (Uses Jest and React Testing Library).
- **Backend**: No explicit test suite found in `package.json`, but `test_content.py` and `test_sqlite_resiliency.py` exist in the root of `recommendation/`. Run them using `python <filename>`.

## 📜 Development Conventions

- **Frontend**:
    - Use Functional Components and Hooks.
    - Prefer CSS Modules for styling to ensure scope isolation.
    - Import `API_URL` from `src/config.js` for all backend requests.
- **Backend**:
    - Use Pydantic models for request/response validation.
    - Maintain modularity by keeping algorithm logic in `src/` and API routing in `api/`.
    - Follow PEP 8 standards for Python code.
- **Environment Variables**:
    - Frontend: `.env` file in `frontend/`.
    - Backend: `.env` file in `recommendation/` (contains Firestore credentials and API settings).

## 🗃️ Memory & Context
- This project uses a hybrid recommendation approach where $\alpha$ (alpha) controls the weight of Content-Based filtering vs Collaborative Filtering.
- The `deezer_cache` table in SQLite is critical for performance to avoid repeated external API calls.
- Model retraining can be triggered via a background task at the `/recommend/retrain` endpoint.
