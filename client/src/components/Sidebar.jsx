import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import logo from '../assets/logo.png';

const Sidebar = ({ activePage, onPageChange }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navigationItems = [
    ...(user?.role === 'admin'
      ? [
          { id: 'dashboard', label: t('sidebar.dashboard'), icon: '📊' },
          { id: 'bots', label: t('sidebar.bot_management'), icon: '🤖' },
        ]
      : []),
    ...(user?.role === 'vendor' || user?.role === 'admin'
      ? [{ id: 'sales', label: t('sidebar.sales_panel'), icon: '💬' }]
      : []),
  ];

  return (
    <aside className="hidden sm:flex flex-col w-64 bg-slate-950 border-r border-slate-800 text-slate-100 h-screen">
      {/* HEADER */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2 mb-3">
          <img src={logo} alt="BotInteligente" className="h-8 w-auto" />
          <div className="leading-tight">
            <p className="font-bold text-base text-white">WhatsApp</p>
            <p className="font-black text-lg text-white tracking-tight">
              Bot Manager
            </p>
          </div>
        </div>

        <div className="mt-1 text-xs text-slate-400">
          <p>
            {t('sidebar.welcome', { name: user?.name || user?.email }) || user?.email}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">
            {user?.role}
          </p>
        </div>

        <div className="mt-3">
          <LanguageSwitcher />
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="px-2 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          {t('sidebar.navigation') || 'Navigation'}
        </p>
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={[
                    'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700',
                  ].join(' ')}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-slate-400">
              {t('sidebar.status_online') || 'Online'}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors space-x-2"
        >
          <span>🚪</span>
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;