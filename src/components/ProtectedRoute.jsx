import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// This component acts as a security wall wrapping around any page we want to protect
function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext);

  // If the global state bubble is still checking for an existing saved local token session
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-b-indigo-600"></div>
      </div>
    );
  }

  // If no token exists, the user is unauthenticated. Redirect them to login instantly.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If a valid keycard token is present, allow access to render the child screen component
  return children;
}

export default ProtectedRoute;
