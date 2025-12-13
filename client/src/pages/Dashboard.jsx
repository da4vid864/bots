import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import BotCard from '../components/BotCard';
import ScoringRulesManager from '../components/ScoringRulesManager';
import ProductManager from '../components/ProductManager';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';

import {
  AddIcon,
  CloseIcon,
  CheckCircleIcon,
  WarningIcon,
  InfoIcon,
  ErrorIcon,
  SmartToyIcon,
  ExpandMoreIcon,
  ExpandLessIcon,
  StarsIcon,
  InventoryIcon,
} from '../components/Icons';

// Iconos adicionales para métricas (simple SVGs)
const UsersIcon = () => (
  <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3S8 5.34 8 7s1.34 3 3 3z" />
  </svg>
);

const Dashboard = () => {
  const { bots, createBot, sseConnected, dashboardStats } = useBots();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [trialWarning, setTrialWarning] = useState(null);

  const [activeSection, setActiveSection] = useState('bots'); // 'bots' | 'scoring' | 'products'

  // Estados para acordiones por bot
  const [scoringExpanded, setScoringExpanded] = useState({});
  const [productsExpanded, setProductsExpanded] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    id: '',
    prompt: '',
  });

  // Suscripción / Trial
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await axios.get('/api/subs/status');
        if (response.data.success && response.data.subscription) {
          setSubscription(response.data.subscription);

          if (
            response.data.subscription.status === 'trial' &&
            response.data.subscription.trial_days_left <= 3
          ) {
            setTrialWarning({
              daysLeft: response.data.subscription.trial_days_left,
              expiresAt: response.data.subscription.trial_ends_at,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    if (user) fetchSubscription();
  }, [user]);

  // Notificaciones de pago/trial vía querystring
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const trialParam = searchParams.get('trial');

    if (trialParam === 'started') {
      setNotification({
        type: 'success',
        title: '🎉 ¡Trial Activado!',
        message: 'Tu prueba de 14 días sin tarjeta ha comenzado.',
        duration: 5000,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'success') {
      setNotification({
        type: 'success',
        title: t('dashboard.notifications.subscription_success_title'),
        message: t('dashboard.notifications.subscription_success_message'),
        duration: 5000,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (paymentStatus || trialParam) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, t]);

  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.id || !formData.prompt) {
      setNotification({
        type: 'error',
        title: 'Error',
        message: t('dashboard.create_bot.validation_error'),
      });
      return;
    }
    setCreateLoading(true);
    try {
      await createBot(formData);
      setFormData({ name: '', id: '', prompt: '' });
      setShowCreateForm(false);
      setNotification({
        type: 'success',
        title: 'Success!',
        message: 'Bot creado correctamente.',
      });
    } catch (error) {
      console.error('Error creating bot:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: t('dashboard.create_bot.creation_error'),
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleScoringForBot = (botId) => {
    setScoringExpanded((prev) => ({
      ...prev,
      [botId]: !prev[botId],
    }));
  };

  const toggleProductsForBot = (botId) => {
    setProductsExpanded((prev) => ({
      ...prev,
      [botId]: !prev[botId],
    }));
  };

  const connectedBots = bots.filter((bot) => bot.runtimeStatus === 'CONNECTED').length;
  const totalBots = bots.length;

  const showStats = user?.role === 'admin';
  const statsLoading = showStats && !dashboardStats;

  return (
    <>
      <Helmet>
        <title>Dashboard | BotInteligente</title>
        <meta
          name="description"
          content="Administra tus bots inteligentes de WhatsApp, leads, scoring y productos desde un solo panel."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* ============ NAVBAR ============ */}
        <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="BotInteligente" className="h-8 w-auto" />
              <span className="font-bold text-lg text-white hidden sm:inline">BotInteligente</span>
              <span className="text-xs sm:text-sm text-slate-400 sm:ml-3">Dashboard</span>
            </div>

            {/* Tabs desktop */}
            <div className="hidden md:flex items-center space-x-1 text-sm">
              <button
                onClick={() => setActiveSection('bots')}
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  activeSection === 'bots'
                    ? 'text-blue-400 bg-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Bots
              </button>
              <button
                onClick={() => setActiveSection('scoring')}
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  activeSection === 'scoring'
                    ? 'text-blue-400 bg-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Scoring
              </button>
              <button
                onClick={() => setActiveSection('products')}
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  activeSection === 'products'
                    ? 'text-blue-400 bg-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Productos
              </button>
              {user?.role === 'admin' && (
                <Link
                  to="/sales"
                  className="px-3 py-2 rounded-md font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  Panel de Ventas
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Estado SSE */}
              <div
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                  sseConnected
                    ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                    : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                {sseConnected ? t('dashboard.status.connected') : t('dashboard.status.disconnected')}
              </div>

              {/* Botón crear bot (solo admin) */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="hidden sm:inline-flex items-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20 text-sm"
                >
                  <span className="ml-2">{t('dashboard.new_bot_button')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs móviles */}
          <div className="md:hidden border-t border-slate-800 bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveSection('bots')}
                  className={`px-3 py-1.5 rounded-full ${
                    activeSection === 'bots' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  Bots
                </button>
                <button
                  onClick={() => setActiveSection('scoring')}
                  className={`px-3 py-1.5 rounded-full ${
                    activeSection === 'scoring'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  Scoring
                </button>
                <button
                  onClick={() => setActiveSection('products')}
                  className={`px-3 py-1.5 rounded-full ${
                    activeSection === 'products'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  Productos
                </button>
              </div>

              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="ml-2 inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs"
                >
                  <AddIcon />
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* ================= CONTENIDO PRINCIPAL ================= */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Notificación flotante */}
          {notification && (
            <div
              className={`fixed top-4 right-4 max-w-sm w-full rounded-lg p-4 shadow-lg z-50 border ${
                notification.type === 'success'
                  ? 'bg-green-900/90 border-green-500/50'
                  : notification.type === 'error'
                  ? 'bg-red-900/90 border-red-500/50'
                  : 'bg-blue-900/90 border-blue-500/50'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && <CheckCircleIcon />}
                  {notification.type === 'error' && <ErrorIcon />}
                  {notification.type === 'info' && <InfoIcon />}
                </div>
                <div className="ml-3 flex-1">
                  <h3
                    className={`text-sm font-semibold ${
                      notification.type === 'success'
                        ? 'text-green-100'
                        : notification.type === 'error'
                        ? 'text-red-100'
                        : 'text-blue-100'
                    }`}
                  >
                    {notification.title}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${
                      notification.type === 'success'
                        ? 'text-green-200'
                        : notification.type === 'error'
                        ? 'text-red-200'
                        : 'text-blue-200'
                    }`}
                  >
                    {notification.message}
                  </p>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-4 flex-shrink-0 text-slate-400 hover:text-slate-300"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
          )}

          {/* Banner de Trial */}
          {trialWarning && (
            <div className="mb-6 sm:mb-8 rounded-xl bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-500/30 p-4 sm:p-6 shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <WarningIcon />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                    ⏰ Tu prueba vence pronto
                  </h3>
                  <p className="text-amber-200 text-sm sm:text-base">
                    Te quedan <strong>{trialWarning.daysLeft}</strong> día
                    {trialWarning.daysLeft !== 1 ? 's' : ''} de acceso ilimitado.
                  </p>
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                    <p className="text-xs sm:text-sm text-amber-300">
                      Después tu acceso volverá al plan Starter.
                    </p>
                    <button
                      onClick={() => navigate('/subs/purchase/pro')}
                      className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 transition-all transform hover:scale-105 active:scale-95 text-sm"
                    >
                      Actualizar a Pro Ahora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header Bienvenida + resumen bots */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1">
                Hola, {user?.name || 'Usuario'} 👋
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">
                Bienvenido a tu dashboard de bots inteligentes
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
              <div className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-200">
                Bots conectados:{' '}
                <span className="font-semibold text-green-400">
                  {connectedBots}/{totalBots}
                </span>
              </div>
              {subscription && (
                <div className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-200">
                  Plan:{' '}
                  <span className="font-semibold text-blue-400">
                    {subscription.status === 'trial' ? 'Trial' : subscription.plan_name || 'Starter'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* MÉTRICAS (por SSE) */}
          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
              Tu desempeño en tiempo real 📊
            </h2>

            {!showStats ? null : statsLoading ? (
              <p className="text-slate-400 text-sm">Cargando métricas...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 max-w-md gap-4 sm:gap-6 mb-4 sm:mb-8">
                  {/* Leads Totales */}
                  <div className="group p-4 sm:p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-400 mb-1">
                          Leads Totales
                        </p>
                        <p className="text-2xl sm:text-3xl font-black text-white">
                          {(dashboardStats?.totalLeads ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UsersIcon />
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          style={{ width: '65%' }}
                        />
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-2">
                        Leads generados por todos tus bots.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button className="inline-flex items-center px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors text-sm">
                    Ver Reporte Completo →
                  </button>
                </div>
              </>
            )}
          </section>

          {/* ================= SECCIÓN BOTS ================= */}
          {activeSection === 'bots' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Tus Bots Inteligentes 🤖</h2>
                  <p className="text-slate-400 text-sm">
                    Conecta, gestiona y escala tus bots de WhatsApp
                  </p>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="sm:hidden inline-flex items-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all text-sm"
                  >
                    <AddIcon />
                    <span className="ml-2">Nuevo Bot</span>
                  </button>
                )}
              </div>

              {totalBots === 0 ? (
                <div className="text-center py-10 sm:py-16 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/50 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center">
                    <SmartToyIcon />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Aún no tienes bots</h3>
                  <p className="text-slate-400 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                    Crea tu primer bot en menos de 5 minutos. Automatiza conversaciones y captura
                    leads 24/7.
                  </p>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="group inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20 text-sm sm:text-base"
                    >
                      <AddIcon />
                      <span className="ml-2">Crear Mi Primer Bot</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {bots.map((bot) => (
                    <div key={bot.id} className="space-y-3">
                      <BotCard bot={bot} />

                      {user?.role === 'admin' && (
                        <div className="space-y-3">
                          {/* Scoring */}
                          <div className="rounded-lg border border-slate-800 bg-slate-900/30 overflow-hidden">
                            <button
                              onClick={() => toggleScoringForBot(bot.id)}
                              className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-slate-800/30 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <StarsIcon />
                                <span className="font-medium text-slate-200 text-sm sm:text-base">
                                  Scoring Rules
                                </span>
                              </div>
                              {scoringExpanded[bot.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </button>
                            {scoringExpanded[bot.id] && (
                              <div className="border-t border-slate-800 p-3 sm:p-4 bg-slate-950/50">
                                <div className="light-form">
                                  <ScoringRulesManager botId={bot.id} />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Productos */}
                          <div className="rounded-lg border border-slate-800 bg-slate-900/30 overflow-hidden">
                            <button
                              onClick={() => toggleProductsForBot(bot.id)}
                              className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-slate-800/30 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <InventoryIcon />
                                <span className="font-medium text-slate-200 text-sm sm:text-base">
                                  Productos
                                </span>
                              </div>
                              {productsExpanded[bot.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </button>
                            {productsExpanded[bot.id] && (
                              <div className="border-t border-slate-800 p-3 sm:p-4 bg-slate-950/50">
                                <div className="light-form">
                                  <ProductManager botId={bot.id} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ================= SECCIÓN SCORING ================= */}
          {activeSection === 'scoring' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Scoring Rules 🎯</h2>
                  <p className="text-slate-400 text-sm">
                    Define cómo se puntúan tus leads automáticamente
                  </p>
                </div>
              </div>

              {bots.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  Primero crea un bot para poder configurar reglas de scoring.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                  {bots.map((bot) => (
                    <div
                      key={bot.id}
                      className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 rounded-2xl border border-slate-800 p-4 sm:p-6"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <SmartToyIcon />
                        <span className="font-medium text-slate-200 text-sm sm:text-base">
                          {bot.name}
                        </span>
                      </div>
                      <ScoringRulesManager botId={bot.id} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ================= SECCIÓN PRODUCTOS ================= */}
          {activeSection === 'products' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Product Management 📦</h2>
                  <p className="text-slate-400 text-sm">
                    Gestiona tus productos y servicios que tus bots pueden ofrecer
                  </p>
                </div>
              </div>

              {bots.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  Primero crea un bot para poder asociar productos.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                  {bots.map((bot) => (
                    <div
                      key={bot.id}
                      className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 rounded-2xl border border-slate-800 p-4 sm:p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <InventoryIcon />
                          <span className="font-medium text-slate-200 text-sm sm:text-base">
                            {bot.name}
                          </span>
                        </div>
                      </div>
                      <ProductManager botId={bot.id} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        {/* MODAL CREAR BOT */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 max-w-md w-full p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Crear Nuevo Bot</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Configura tu bot en 5 minutos
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleCreateBot}>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                      Nombre del Bot
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2.5 sm:p-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 text-sm"
                      placeholder="Mi Bot de Ventas"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                      ID del Bot
                    </label>
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleInputChange}
                      className="w-full p-2.5 sm:p-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 text-sm"
                      placeholder="ventas-bot"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                      Prompt Personalizado
                    </label>
                    <textarea
                      name="prompt"
                      value={formData.prompt}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full p-2.5 sm:p-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 resize-none text-sm"
                      placeholder="Eres un asistente de ventas profesional. Tu objetivo es..."
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0 mt-5 sm:mt-6">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95 text-sm"
                  >
                    {createLoading ? 'Creando Bot...' : 'Crear Bot'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 sm:py-3 px-4 rounded-lg font-medium transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;