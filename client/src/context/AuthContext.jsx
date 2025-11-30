import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create Auth Context
const AuthContext = createContext();

// Axios configuration for API calls
const api = axios.create({
  baseURL: '/', // Use relative URLs with Vite proxy
  withCredentials: true, // Important for cookies
});

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
      const response = await api.get('/api/auth/status');
      
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
    // Redirect to Google OAuth
    window.location.href = '/auth/google';
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;