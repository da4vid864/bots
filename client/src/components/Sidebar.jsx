import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activePage, onPageChange }) => {
  const { user, logout } = useAuth();

  const navigationItems = [
    ...(user?.role === 'admin' ? [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'bots', label: 'Bot Management', icon: '🤖' },
    ] : []),
    ...(user?.role === 'vendor' || user?.role === 'admin' ? [
      { id: 'sales', label: 'Sales Panel', icon: '💬' },
    ] : []),
  ];

  return (
    <div className="w-64 bg-gray-800 text-white h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">WhatsApp Bot Manager</h1>
        <div className="mt-2 text-sm text-gray-300">
          <p>Welcome, {user?.name || user?.email}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                  activePage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Status: Online</span>
          <button
            onClick={logout}
            className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;