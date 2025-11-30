import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BotsProvider } from './context/BotsContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesPanel from './pages/SalesPanel';
import './App.css';

// Main App Content with Routing
const AppContent = () => {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Determine default page based on user role
  const getDefaultPage = () => {
    if (user.role === 'admin') return 'dashboard';
    if (user.role === 'vendor') return 'sales';
    return 'dashboard';
  };

  const currentPage = activePage || getDefaultPage();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'bots':
        return <Dashboard />; // Bot management is part of dashboard
      case 'sales':
        return <SalesPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePage={currentPage} onPageChange={setActivePage} />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
};

// Main App Component with Providers
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
