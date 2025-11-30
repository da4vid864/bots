import React from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, loading, error } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🤖</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            WhatsApp Bot Manager
          </h1>
          <p className="text-gray-600">
            Manage multiple WhatsApp bots with intelligent automation
          </p>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Powerful Features
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <span>✅</span>
              <span>Multi-bot Management</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <span>✅</span>
              <span>AI-Powered Responses</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <span>✅</span>
              <span>Real-time Monitoring</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <span>✅</span>
              <span>Lead Qualification</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <span>✅</span>
              <span>Sales Panel</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <span>✅</span>
              <span>Team Collaboration</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <span>⚠️</span>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                />
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;