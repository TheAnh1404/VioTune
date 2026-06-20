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
import PlaylistsPage from './pages/PlaylistsPage/PlaylistsPage';
import ArtistPage from './pages/ArtistPage/ArtistPage';
import AboutPage from './pages/InfoPages/AboutPage';
import ContactPage from './pages/InfoPages/ContactPage';
import FAQPage from './pages/InfoPages/FAQPage';
import PrivacyPage from './pages/InfoPages/PrivacyPage';

function App() {
  return (
    <AuthProvider>
      <PlaybackProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Onboarding />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/recommendation"
                element={
                  <ProtectedRoute>
                    <Recommendation />
                  </ProtectedRoute>
                }
              />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
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
                path="/playlists"
                element={
                  <ProtectedRoute>
                    <PlaylistsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/artist/:artistName"
                element={
                  <ProtectedRoute>
                    <ArtistPage />
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
