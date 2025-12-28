import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

// Create Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/status', { timeout: 5000 });
      
      if (response.data.authenticated) {
        setUser(response.data.user);
        setError(null);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // Redirect to Google OAuth - Using absolute URL based on environment
    // In development, Vite proxy handles /auth/google -> http://localhost:3000/auth/google
    // In production, it's served from same origin
    window.location.href = `${window.location.origin}/auth/google`;
  };

  const logout = async () => {
    try {
      await api.get('/auth/logout');
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setError('Logout failed');
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuthStatus,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isVendor: user?.role === 'vendor',
    tenant: user?.tenant_id ? { id: user.tenant_id, name: user.tenant_name } : null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;