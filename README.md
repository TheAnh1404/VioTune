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

## ⚡ Quick Start

### Backend Setup
1. Navigate to the `recommendation` directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI server:
   ```bash
   uvicorn api.app:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

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