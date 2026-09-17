import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Directory from './pages/Directory';
import Library from './pages/Library';
import QuizList from './pages/QuizList';
import QuizEngine from './pages/QuizEngine';
import Dashboard from './pages/Dashboard'; // 👈 1. ADD THIS IMPORT LINE HERE!

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 🚀 2. UPDATE THIS ROUTE BLOCK TO MOUNT THE LIVE COMPONENT: */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard /> 
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/directory" 
          element={
            <ProtectedRoute>
              <Layout>
                <Directory />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/library" 
          element={
            <ProtectedRoute>
              <Layout>
                <Library />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/quizzes" 
          element={
            <ProtectedRoute>
              <Layout>
                <QuizList />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/quiz/:id" 
          element={
            <ProtectedRoute>
              <QuizEngine /> 
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
