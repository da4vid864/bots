import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BotsProvider } from './context/BotsContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesPanel from './pages/SalesPanel';
import './App.css';

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const getActivePage = (path) => {
    if (path.includes('sales')) return 'sales';
    if (path.includes('bots')) return 'bots';
    return 'dashboard';
  };

  const handlePageChange = (pageId) => {
    switch(pageId) {
      case 'sales': navigate('/sales'); break;
      case 'bots': navigate('/dashboard'); break;
      case 'dashboard': navigate('/dashboard'); break;
      default: navigate('/dashboard');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePage={getActivePage(location.pathname)} onPageChange={handlePageChange} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/pricing" element={<Login />} />
      
      <Route path="/dashboard" element={
        <ProtectedLayout>
          <Dashboard />
        </ProtectedLayout>
      } />
      
      <Route path="/sales" element={
        <ProtectedLayout>
          <SalesPanel />
        </ProtectedLayout>
      } />

      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BotsProvider>
        <AppContent />
      </BotsProvider>
    </AuthProvider>
  );
}

export default App;
