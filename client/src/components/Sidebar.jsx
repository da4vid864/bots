import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Sidebar = ({ activePage, onPageChange }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navigationItems = [
    ...(user?.role === 'admin' ? [
      { id: 'dashboard', label: t('sidebar.dashboard'), icon: '📊' },
      { id: 'bots', label: t('sidebar.bot_management'), icon: '🤖' },
    ] : []),
    ...(user?.role === 'vendor' || user?.role === 'admin' ? [
      { id: 'sales', label: t('sidebar.sales_panel'), icon: '💬' },
    ] : []),
  ];

  return (
    <div className="w-64 bg-gray-800 text-white h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">{t('sidebar.title')}</h1>
        <div className="mt-2 text-sm text-gray-300">
          <p>{t('sidebar.welcome', { name: user?.name || user?.email })}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
        <div className="mt-4">
          <LanguageSwitcher />
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
          <span className="text-gray-400">{t('sidebar.status_online')}</span>
          <button
            onClick={logout}
            className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
          >
            <span>🚪</span>
            <span>{t('sidebar.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;