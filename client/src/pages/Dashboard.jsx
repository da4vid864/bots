import React, { useState, useEffect } from 'react';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import BotCard from '../components/BotCard';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScoringRulesManager from '../components/ScoringRulesManager';
import ProductManager from '../components/ProductManager';
import axios from 'axios';

// Material Design Icons
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import DiamondIcon from '@mui/icons-material/Diamond';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StarsIcon from '@mui/icons-material/Stars';
import InventoryIcon from '@mui/icons-material/Inventory';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

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
              {notification.type === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-400" />}
              {notification.type === 'error' && <ErrorIcon className="w-5 h-5 text-red-400" />}
              {notification.type === 'info' && <InfoIcon className="w-5 h-5 text-blue-400" />}
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
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Trial Warning Banner */}
      {trialWarning && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-500/30 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <WarningIcon className="w-5 h-5 text-amber-400" />
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
              <AddIcon className="w-5 h-5 mr-2" />
              {t('dashboard.new_bot_button')}
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
                <SmartToyIcon className="w-6 h-6 text-blue-400" />
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
                <FlashOnIcon className="w-6 h-6 text-green-400" />
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
                <DiamondIcon className="w-6 h-6 text-purple-400" />
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
                <CloseIcon className="w-5 h-5" />
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
            <SmartToyIcon className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">
              {totalBots === 1 ? t('dashboard.bots_count', { count: totalBots }) : t('dashboard.bots_count_plural', { count: totalBots })}
            </span>
          </div>
        </div>

        {totalBots === 0 ? (
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 rounded-2xl border border-slate-800 border-dashed p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center">
              <AutoAwesomeIcon className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('dashboard.empty_state.title')}</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              {t('dashboard.empty_state.description')}
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="group inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <AddIcon className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              {t('dashboard.empty_state.button')}
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
                          <StarsIcon className="w-5 h-5 text-blue-400" />
                          <span className="font-medium text-slate-200">
                            {t('dashboard.manage_scoring', 'Scoring Rules')}
                          </span>
                        </div>
                        {scoringExpanded[bot.id] ? (
                          <ExpandLessIcon className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ExpandMoreIcon className="w-5 h-5 text-slate-400" />
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
                          <InventoryIcon className="w-5 h-5 text-blue-400" />
                          <span className="font-medium text-slate-200">
                            {t('dashboard.manage_products', 'Products')}
                          </span>
                        </div>
                        {productsExpanded[bot.id] ? (
                          <ExpandLessIcon className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ExpandMoreIcon className="w-5 h-5 text-slate-400" />
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