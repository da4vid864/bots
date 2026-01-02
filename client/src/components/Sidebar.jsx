import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useUserPreferences } from '../hooks/useUserPreferences';
import logo from '../assets/logo.png';

// Iconos SVG para el sidebar
const NavDashboardIcon = () => (
  <svg
    className="w-4 h-4 text-blue-400"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M3 13h6v8H3v-8zm12-6h6v14h-6V7zM9 3h6v18H9V3z" />
  </svg>
);

const NavSalesIcon = () => (
  <svg
    className="w-4 h-4 text-blue-400"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H7l-4 4V6c0-1.1.9-2 2-2zm0 2v11.17L6.17 15H20V6H4zm4 2h8v2H8V8zm0 3h5v2H8v-2z" />
  </svg>
);

const NavPrivacyIcon = () => (
  <svg
    className="w-4 h-4 text-blue-400"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
  </svg>
);

const Sidebar = ({ activePage, onPageChange }) => {
  const { user, logout, tenant } = useAuth();
  const { t } = useTranslation();
  const { preferences, updatePreference } = useUserPreferences();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(preferences.sidebarCollapsed && !isMobile);

  // Detectar si es móvil y aplicar preferencias
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false); // Cerrar en desktop
        setIsCollapsed(preferences.sidebarCollapsed);
      } else {
        setIsCollapsed(false); // No colapsar en móvil
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [preferences.sidebarCollapsed]);

  // Cerrar sidebar al hacer click fuera en móvil
  useEffect(() => {
    if (isMobileOpen && isMobile) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('.sidebar-container') && !e.target.closest('.sidebar-toggle')) {
          setIsMobileOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileOpen, isMobile]);

  // Solo Dashboard (admin) y Sales Panel (admin / vendor)
  const navigationItems = [
    ...(user?.role === 'admin'
      ? [
          {
            id: 'dashboard',
            label: t('sidebar.dashboard'),
            icon: <NavDashboardIcon />,
          },
        ]
      : []),
    ...(user?.role === 'vendor' || user?.role === 'admin'
      ? [
          {
            id: 'sales',
            label: t('sidebar.sales_panel'),
            icon: <NavSalesIcon />,
          },
        ]
      : []),
    {
      id: 'privacy',
      label: t('privacy.title') || 'Privacy Portal',
      icon: <NavPrivacyIcon />,
    },
  ];

  const handlePageChange = (pageId) => {
    onPageChange(pageId);
    if (isMobile) {
      setIsMobileOpen(false); // Cerrar sidebar en móvil después de navegar
    }
  };

  return (
    <>
      {/* Botón toggle para móvil */}
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-4 left-4 z-50 lg:hidden sidebar-toggle p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={isMobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMobileOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      )}

      {/* Overlay para móvil */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          sidebar-container
          flex flex-col ${isCollapsed ? 'w-16' : 'w-64'} bg-slate-950 border-r border-slate-800 text-slate-100 h-screen
          fixed lg:static z-40
          transform transition-all duration-300 ease-in-out
          ${isMobile && !isMobileOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
        aria-label="Navegación principal"
      >
      {/* HEADER */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2 mb-3">
          <img src={logo} alt="BotInteligente" className="h-8 w-auto flex-shrink-0" />
          {!isCollapsed && (
            <div className="leading-tight">
              <p className="font-bold text-base text-white">WhatsApp</p>
              <p className="font-black text-lg text-white tracking-tight">
                Bot Manager
              </p>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="mt-1 text-xs text-slate-400">
            <p>
              {t('sidebar.welcome', { name: user?.name || user?.email }) ||
                user?.email}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">
              {user?.role} {tenant ? `• ${tenant.name}` : ''}
            </p>
          </div>
        )}

        {!isCollapsed && (
          <div className="mt-3">
            <LanguageSwitcher />
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {!isCollapsed && (
          <p className="px-2 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {t('sidebar.navigation') || 'Sidebar Navigation'}
          </p>
        )}
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handlePageChange(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={[
                    'w-full flex items-center rounded-lg text-sm font-medium transition-all',
                    isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-3 px-3 py-2.5',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700',
                  ].join(' ')}
                  aria-label={item.label}
                >
                  <span className="flex items-center justify-center">
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Botón para colapsar/expandir (solo desktop) */}
      {!isMobile && (
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            updatePreference('sidebarCollapsed', !isCollapsed);
          }}
          className="hidden lg:flex items-center justify-center p-2 mx-2 mb-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      )}

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
          <span className="text-slate-400">⏏</span>
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;