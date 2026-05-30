import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { PlaybackProvider } from './context/PlaybackContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Onboarding from './components/Onboarding/Onboarding';
import Login from './components/Login/Login';
import Recommendation from './components/Recommendation';
import HomePage from './pages/HomePage/HomePage';
import SearchPage from './pages/SearchPage/SearchPage';
import PlayerPage from './pages/PlayerPage/PlayerPage';

function App() {
  return (
    <AuthProvider>
      <PlaybackProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Onboarding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/recommendation" element={<Recommendation />} />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/player"
                element={
                  <ProtectedRoute>
                    <PlayerPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </PlaybackProvider>
    </AuthProvider>
  );
}

export default App;
