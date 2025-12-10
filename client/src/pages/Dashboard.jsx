import React, { useState, useEffect } from 'react';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import BotCard from '../components/BotCard';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScoringRulesManager from '../components/ScoringRulesManager';
import ProductManager from '../components/ProductManager';
import axios from 'axios';

const Dashboard = () => {
  const { bots, createBot, sseConnected } = useBots();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [notification, setNotification] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [trialWarning, setTrialWarning] = useState(null);
  const [scoringExpanded, setScoringExpanded] = useState({});
  const [productsExpanded, setProductsExpanded] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    prompt: ''
  });

  // Iconos SVG embebidos
  const AddIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  );

  const CheckCircleIcon = () => (
    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );

  const WarningIcon = () => (
    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  );

  const InfoIcon = () => (
    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
  );

  const ErrorIcon = () => (
    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  );

  const SmartToyIcon = () => (
    <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>
    </svg>
  );

  const FlashOnIcon = () => (
    <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
    </svg>
  );

  const DiamondIcon = () => (
    <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L5 12l7 10 7-10z"/>
    </svg>
  );

  const ExpandMoreIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
    </svg>
  );

  const ExpandLessIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
    </svg>
  );

  const StarsIcon = () => (
    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/>
    </svg>
  );

  const InventoryIcon = () => (
    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z"/>
    </svg>
  );

  const AutoAwesomeIcon = () => (
    <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
    </svg>
  );

  // Obtener información de suscripción
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await axios.get('/api/subs/status');
        if (response.data.success && response.data.subscription) {
          setSubscription(response.data.subscription);

          // Mostrar advertencia si el trial está por expirar (menos de 3 días)
          if (response.data.subscription.status === 'trial' && response.data.subscription.trial_days_left <= 3) {
            setTrialWarning({
              daysLeft: response.data.subscription.trial_days_left,
              expiresAt: response.data.subscription.trial_ends_at
            });
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    if (user) {
      fetchSubscription();
    }
  }, [user]);

  // Efecto para manejar notificaciones de pago
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const trialParam = searchParams.get('trial');
    
    if (trialParam === 'started') {
      setNotification({
        type: 'success',
        title: '🎉 ¡Trial Activado!',
        message: 'Tu prueba de 14 días sin tarjeta ha comenzado. Acceso ilimitado a todos los bots.',
        duration: 5000
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'success') {
      setNotification({
        type: 'success',
        title: t('dashboard.notifications.subscription_success_title'),
        message: t('dashboard.notifications.subscription_success_message'),
        duration: 5000
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      setNotification({
        type: 'info',
        title: t('dashboard.notifications.payment_cancelled_title'),
        message: t('dashboard.notifications.payment_cancelled_message'),
        duration: 5000
      });
    } else if (searchParams.get('error')) {
      setNotification({
        type: 'error',
        title: t('dashboard.notifications.error_title'),
        message: t('dashboard.notifications.error_message'),
        duration: 5000
      });
    }
    
    // Auto-ocultar
    if (paymentStatus || trialParam) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.id || !formData.prompt) {
      setNotification({
        type: 'error',
        title: 'Error',
        message: t('dashboard.create_bot.validation_error'),
        duration: 3000
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
        title: '¡Éxito!',
        message: 'Bot creado correctamente',
        duration: 3000
      });
    } catch (error) {
      console.error('Error creando bot:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: t('dashboard.create_bot.creation_error'),
        duration: 3000
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleScoringExpanded = (botId) => {
    setScoringExpanded(prev => ({
      ...prev,
      [botId]: !prev[botId]
    }));
  };

  const toggleProductsExpanded = (botId) => {
    setProductsExpanded(prev => ({
      ...prev,
      [botId]: !prev[botId]
    }));
  };

  const connectedBots = bots.filter(bot => bot.runtimeStatus === 'CONNECTED').length;
  const totalBots = bots.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      
      {/* Notificación Global */}
      {notification && (
        <div className={`fixed bottom-4 right-4 max-w-sm w-full rounded-lg p-4 shadow-lg z-50 border ${
          notification.type === 'success' ? 'bg-green-900/90 border-green-500/50' : 
          notification.type === 'error' ? 'bg-red-900/90 border-red-500/50' :
          'bg-blue-900/90 border-blue-500/50'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {notification.type === 'success' && <CheckCircleIcon />}
              {notification.type === 'error' && <ErrorIcon />}
              {notification.type === 'info' && <InfoIcon />}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-semibold ${
                notification.type === 'success' ? 'text-green-100' : 
                notification.type === 'error' ? 'text-red-100' : 'text-blue-100'
              }`}>
                {notification.title}
              </h3>
              <p className={`mt-1 text-sm ${
                notification.type === 'success' ? 'text-green-200' : 
                notification.type === 'error' ? 'text-red-200' : 'text-blue-200'
              }`}>
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

      {/* Trial Warning Banner */}
      {trialWarning && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-500/30 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <WarningIcon />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-amber-100">
                Tu prueba vence pronto
              </h3>
              <p className="mt-1 text-sm text-amber-200">
                Te quedan <strong>{trialWarning.daysLeft}</strong> día{trialWarning.daysLeft !== 1 ? 's' : ''} para disfrutar del acceso ilimitado.
              </p>
              <div className="mt-3">
                <Link
                  to="/subs/purchase/pro"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium hover:from-amber-700 hover:to-amber-600 transition-all transform hover:scale-105 active:scale-95"
                >
                  Actualizar a Pro Ahora
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
              {t('dashboard.title')}
            </h1>
            <p className="text-slate-400">
              {t('dashboard.welcome', { name: user?.name || user?.email })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
              sseConnected 
                ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30' 
                : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              {sseConnected ? t('dashboard.status.connected') : t('dashboard.status.disconnected')}
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="group inline-flex items-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <AddIcon />
              <span className="ml-2">{t('dashboard.new_bot_button')}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Bots Card */}
          <div className="group p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950 hover:border-blue-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">{t('dashboard.stats.total_bots')}</p>
                <p className="text-3xl font-black text-white">{totalBots}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <SmartToyIcon />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  style={{ width: `${(connectedBots / Math.max(totalBots, 1)) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {connectedBots} de {totalBots} activos
              </p>
            </div>
          </div>

          {/* Active Bots Card */}
          <div className="group p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950 hover:border-green-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">{t('dashboard.stats.active_bots')}</p>
                <p className="text-3xl font-black text-green-400">{connectedBots}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FlashOnIcon />
              </div>
            </div>
            <div className="mt-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                Activo • 24/7
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="group p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950 hover:border-purple-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">{t('dashboard.stats.current_plan')}</p>
                <p className="text-3xl font-black text-white">
                  {subscription ? (
                    subscription.status === 'trial' ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                        PRO TRIAL
                      </span>
                    ) : (
                      subscription.plan.toUpperCase()
                    )
                  ) : (
                    <span className="text-slate-400">CARGANDO...</span>
                  )}
                </p>
                {subscription?.status === 'trial' && (
                  <div className="text-sm font-semibold mt-1">
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text">
                      {subscription?.trial_days_left} días restantes
                    </span>
                  </div>
                )}
                <Link 
                  to="/pricing" 
                  className="text-sm text-blue-400 hover:text-blue-300 mt-1 inline-flex items-center transition-colors"
                >
                  Ver planes
                </Link>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DiamondIcon />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Bot Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{t('dashboard.create_bot.title')}</h2>
                <p className="text-sm text-slate-400 mt-1">Crea un nuevo bot de WhatsApp</p>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            
            <form onSubmit={handleCreateBot}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('dashboard.create_bot.name_label')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
                    placeholder={t('dashboard.create_bot.name_placeholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('dashboard.create_bot.id_label')}
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
                    placeholder={t('dashboard.create_bot.id_placeholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('dashboard.create_bot.prompt_label')}
                  </label>
                  <textarea
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 resize-none"
                    placeholder={t('dashboard.create_bot.prompt_placeholder')}
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95"
                >
                  {createLoading ? t('dashboard.create_bot.submit_creating') : t('dashboard.create_bot.submit')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {t('dashboard.create_bot.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bots Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{t('dashboard.my_bots')}</h2>
            <p className="text-slate-400 text-sm">Gestiona todos tus bots de WhatsApp en un solo lugar</p>
          </div>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-800/50 text-slate-300">
            <SmartToyIcon />
            <span className="ml-2 text-sm font-medium">
              {totalBots === 1 ? t('dashboard.bots_count', { count: totalBots }) : t('dashboard.bots_count_plural', { count: totalBots })}
            </span>
          </div>
        </div>

        {totalBots === 0 ? (
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 rounded-2xl border border-slate-800 border-dashed p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center">
              <AutoAwesomeIcon />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('dashboard.empty_state.title')}</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              {t('dashboard.empty_state.description')}
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="group inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <AddIcon />
              <span className="ml-2">{t('dashboard.empty_state.button')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map(bot => (
              <div key={bot.id} className="space-y-4">
                <BotCard bot={bot} />
                
                {/* Admin Management Section */}
                {user?.role === 'admin' && (
                  <div className="space-y-3">
                    {/* Scoring Rules */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900/30 overflow-hidden">
                      <button
                        onClick={() => toggleScoringExpanded(bot.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <StarsIcon />
                          <span className="font-medium text-slate-200">
                            {t('dashboard.manage_scoring', 'Scoring Rules')}
                          </span>
                        </div>
                        {scoringExpanded[bot.id] ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </button>
                      {scoringExpanded[bot.id] && (
                        <div className="border-t border-slate-800 p-4 bg-slate-950/50">
                          <ScoringRulesManager botId={bot.id} />
                        </div>
                      )}
                    </div>

                    {/* Products */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900/30 overflow-hidden">
                      <button
                        onClick={() => toggleProductsExpanded(bot.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <InventoryIcon />
                          <span className="font-medium text-slate-200">
                            {t('dashboard.manage_products', 'Products')}
                          </span>
                        </div>
                        {productsExpanded[bot.id] ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </button>
                      {productsExpanded[bot.id] && (
                        <div className="border-t border-slate-800 p-4 bg-slate-950/50">
                          <ProductManager botId={bot.id} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;