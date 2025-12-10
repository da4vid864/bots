import React, { useState, useEffect } from 'react';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import BotCard from '../components/BotCard';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScoringRulesManager from '../components/ScoringRulesManager';
import ProductManager from '../components/ProductManager';
import axios from 'axios';
import { 
    AddIcon, CloseIcon, CheckCircleIcon, WarningIcon, InfoIcon, ErrorIcon,
    SmartToyIcon, FlashOnIcon, DiamondIcon, ExpandMoreIcon, ExpandLessIcon,
    StarsIcon, InventoryIcon, AutoAwesomeIcon
} from '../components/Icons'; // Assuming icons are moved to a separate file for clarity

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

  // Fetch subscription info
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data } = await axios.get('/api/subs/status');
        if (data.success && data.subscription) {
          setSubscription(data.subscription);
          if (data.subscription.status === 'trial' && data.subscription.trial_days_left <= 3) {
            setTrialWarning({
              daysLeft: data.subscription.trial_days_left,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };
    if (user) fetchSubscription();
  }, [user]);

  // Handle payment notifications
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const trialParam = searchParams.get('trial');
    let notif = null;

    if (trialParam === 'started') {
      notif = { type: 'success', title: '🎉 ¡Trial Activado!', message: 'Tu prueba de 14 días ha comenzado.' };
    } else if (paymentStatus === 'success') {
      notif = { type: 'success', title: t('dashboard.notifications.subscription_success_title'), message: t('dashboard.notifications.subscription_success_message') };
    } else if (paymentStatus === 'cancelled') {
      notif = { type: 'info', title: t('dashboard.notifications.payment_cancelled_title'), message: t('dashboard.notifications.payment_cancelled_message') };
    } else if (searchParams.get('error')) {
      notif = { type: 'error', title: t('dashboard.notifications.error_title'), message: t('dashboard.notifications.error_message') };
    }

    if (notif) {
      setNotification(notif);
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, t]);

  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.id || !formData.prompt) {
      setNotification({ type: 'error', title: 'Error', message: t('dashboard.create_bot.validation_error') });
      return;
    }
    setCreateLoading(true);
    try {
      await createBot(formData);
      setFormData({ name: '', id: '', prompt: '' });
      setShowCreateForm(false);
      setNotification({ type: 'success', title: '¡Éxito!', message: 'Bot creado correctamente.' });
    } catch (error) {
      console.error('Error creando bot:', error);
      setNotification({ type: 'error', title: 'Error', message: t('dashboard.create_bot.creation_error') });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAccordion = (botId, type) => {
    if (type === 'scoring') {
      setScoringExpanded(prev => ({ ...prev, [botId]: !prev[botId] }));
    } else if (type === 'products') {
      setProductsExpanded(prev => ({ ...prev, [botId]: !prev[botId] }));
    }
  };

  const connectedBots = bots.filter(bot => bot.runtimeStatus === 'CONNECTED').length;
  const totalBots = bots.length;

  // --- Reusable Components ---

  const NotificationPopup = ({ notif, onDismiss }) => (
    <div className={`fixed bottom-4 right-4 max-w-sm w-full rounded-lg p-4 shadow-lg z-50 border ${
      { success: 'bg-green-900/90 border-green-500/50', error: 'bg-red-900/90 border-red-500/50', info: 'bg-blue-900/90 border-blue-500/50' }[notif.type]
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          {notif.type === 'success' && <CheckCircleIcon />}
          {notif.type === 'error' && <ErrorIcon />}
          {notif.type === 'info' && <InfoIcon />}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-semibold text-white`}>{notif.title}</h3>
          <p className={`mt-1 text-sm text-slate-300`}>{notif.message}</p>
        </div>
        <button onClick={onDismiss} className="ml-4 flex-shrink-0 text-slate-400 hover:text-white"><CloseIcon /></button>
      </div>
    </div>
  );

  const TrialWarningBanner = ({ daysLeft }) => (
    <div className="mb-6 rounded-xl bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-500/30 p-4 flex items-start">
      <div className="flex-shrink-0"><WarningIcon /></div>
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-semibold text-amber-100">Tu prueba vence pronto</h3>
        <p className="mt-1 text-sm text-amber-200">Te quedan <strong>{daysLeft}</strong> día{daysLeft !== 1 ? 's' : ''}.</p>
        <div className="mt-3">
          <Link to="/subs/purchase/pro" className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold hover:from-amber-700 hover:to-amber-600 transition-all transform hover:scale-105 active:scale-95">
            Actualizar a Pro
          </Link>
        </div>
      </div>
    </div>
  );
  
  const StatCard = ({ title, value, icon, progress, progressText }) => (
    <div className="group p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-black text-white">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
          {icon}
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">{progressText}</p>
        </div>
      )}
    </div>
  );

  const CreateBotModal = () => (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{t('dashboard.create_bot.title')}</h2>
          <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-white"><CloseIcon /></button>
        </div>
        <form onSubmit={handleCreateBot}>
          <div className="space-y-4">
            {/* Form Fields */}
            {['name', 'id', 'prompt'].map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t(`dashboard.create_bot.${field}_label`)}</label>
                <input
                  type="text"
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t(`dashboard.create_bot.${field}_placeholder`)}
                  required
                />
              </div>
            ))}
          </div>
          <div className="flex space-x-3 mt-8">
            <button type="submit" disabled={createLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 transition-all transform hover:scale-105">
              {createLoading ? t('dashboard.create_bot.submit_creating') : t('dashboard.create_bot.submit')}
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-lg font-medium transition-colors">
              {t('dashboard.create_bot.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  const AdminAccordion = ({ botId, type, title, icon, isExpanded, onToggle, children }) => (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
          <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center space-x-3">
                  {icon}
                  <span className="font-medium text-slate-200">{title}</span>
              </div>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </button>
          {isExpanded && (
              <div className="border-t border-slate-800 p-4 bg-slate-900">
                  {children}
              </div>
          )}
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      
      {notification && <NotificationPopup notif={notification} onDismiss={() => setNotification(null)} />}
      {trialWarning && <TrialWarningBanner daysLeft={trialWarning.daysLeft} />}

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{t('dashboard.title')}</h1>
            <p className="text-slate-400">{t('dashboard.welcome', { name: user?.name || user?.email })}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${sseConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              {sseConnected ? t('dashboard.status.connected') : t('dashboard.status.disconnected')}
            </div>
            <button onClick={() => setShowCreateForm(true)} className="group inline-flex items-center px-4 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20">
              <AddIcon />
              <span className="ml-2">{t('dashboard.new_bot_button')}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title={t('dashboard.stats.total_bots')}
            value={totalBots}
            icon={<SmartToyIcon />}
            progress={(connectedBots / Math.max(totalBots, 1)) * 100}
            progressText={`${connectedBots} de ${totalBots} activos`}
          />
          <StatCard 
            title={t('dashboard.stats.active_bots')}
            value={<span className="text-green-400">{connectedBots}</span>}
            icon={<FlashOnIcon className="text-green-400" />}
          />
          <StatCard 
            title={t('dashboard.stats.current_plan')}
            value={subscription ? (subscription.status === 'trial' ? <span className="text-amber-400">PRO TRIAL</span> : subscription.plan.toUpperCase()) : "..."}
            icon={<DiamondIcon className="text-purple-400" />}
          />
        </div>
      </header>

      {showCreateForm && <CreateBotModal />}

      {/* Bots Section */}
      <main>
        <h2 className="text-2xl font-bold text-white mb-6">{t('dashboard.my_bots')}</h2>
        {totalBots === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 border-dashed p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-900/50 flex items-center justify-center"><AutoAwesomeIcon /></div>
            <h3 className="text-xl font-bold text-white mb-2">{t('dashboard.empty_state.title')}</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">{t('dashboard.empty_state.description')}</p>
            <button onClick={() => setShowCreateForm(true)} className="group inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all transform hover:scale-105">
              <AddIcon /><span className="ml-2">{t('dashboard.empty_state.button')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map(bot => (
              <div key={bot.id} className="space-y-4">
                <BotCard bot={bot} />
                {user?.role === 'admin' && (
                  <div className="space-y-3">
                     <AdminAccordion botId={bot.id} type="scoring" title={t('dashboard.manage_scoring', 'Scoring Rules')} icon={<StarsIcon />} isExpanded={!!scoringExpanded[bot.id]} onToggle={() => toggleAccordion(bot.id, 'scoring')}>
                         <ScoringRulesManager botId={bot.id} />
                     </AdminAccordion>
                     <AdminAccordion botId={bot.id} type="products" title={t('dashboard.manage_products', 'Products')} icon={<InventoryIcon />} isExpanded={!!productsExpanded[bot.id]} onToggle={() => toggleAccordion(bot.id, 'products')}>
                         <ProductManager botId={bot.id} />
                     </AdminAccordion>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
