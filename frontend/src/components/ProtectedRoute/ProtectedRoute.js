import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 * Redirects to /login if user is not signed in.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a0a0f',
        color: '#fff',
        fontSize: '18px',
        fontFamily: 'Inter, sans-serif'
      }}>
        <span style={{ marginRight: '12px', fontSize: '28px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>♪</span>
        Loading VioTune...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
