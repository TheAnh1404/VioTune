import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Onboarding from './components/Onboarding/Onboarding';
import Login from './components/Login/Login';
import Recommendation from './components/Recommendation';
import HomePage from './pages/HomePage/HomePage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/recommendation" element={<Recommendation />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
