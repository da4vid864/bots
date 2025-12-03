import React, { useState, useEffect } from 'react';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import BotCard from '../components/BotCard';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScoringRulesManager from '../components/ScoringRulesManager';
import ProductManager from '../components/ProductManager';

const Dashboard = () => {
  const { bots, createBot, sseConnected } = useBots();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [notification, setNotification] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    prompt: ''
  });

  // Efecto para manejar notificaciones de pago
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    
    if (paymentStatus === 'success') {
      setNotification({
        type: 'success',
        title: t('dashboard.notifications.subscription_success_title'),
        message: t('dashboard.notifications.subscription_success_message')
      });
      // Limpiar URL param opcionalmente
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      setNotification({
        type: 'info',
        title: t('dashboard.notifications.payment_cancelled_title'),
        message: t('dashboard.notifications.payment_cancelled_message')
      });
    } else if (searchParams.get('error')) {
       setNotification({
        type: 'error',
        title: t('dashboard.notifications.error_title'),
        message: t('dashboard.notifications.error_message')
      });
    }
    
    // Auto-ocultar después de 5 segundos
    if (paymentStatus) {
        const timer = setTimeout(() => setNotification(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.id || !formData.prompt) {
      alert(t('dashboard.create_bot.validation_error'));
      return;
    }

    setCreateLoading(true);
    try {
      await createBot(formData);
      setFormData({ name: '', id: '', prompt: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creando bot:', error);
      alert(t('dashboard.create_bot.creation_error'));
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

  const connectedBots = bots.filter(bot => bot.runtimeStatus === 'CONNECTED').length;
  const totalBots = bots.length;

  return (
    <div className="p-6 relative">
      
      {/* Notificaciones Flotantes */}
      {notification && (
        <div className={`fixed top-4 right-4 max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden z-50 ${
            notification.type === 'success' ? 'bg-green-50 border-l-4 border-green-400' : 
            notification.type === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
            'bg-blue-50 border-l-4 border-blue-400'
        }`}>
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && <span className="text-green-400 text-xl">✓</span>}
                {notification.type === 'error' && <span className="text-red-400 text-xl">✕</span>}
                {notification.type === 'info' && <span className="text-blue-400 text-xl">ℹ</span>}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                    notification.type === 'success' ? 'text-green-800' : 
                    notification.type === 'error' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {notification.title}
                </h3>
                <div className={`mt-1 text-sm ${
                    notification.type === 'success' ? 'text-green-700' : 
                    notification.type === 'error' ? 'text-red-700' : 'text-blue-700'
                }`}>
                  <p>{notification.message}</p>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setNotification(null)}
                >
                  <span className="sr-only">Cerrar</span>
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('dashboard.title')}</h1>
            <p className="text-gray-600">{t('dashboard.welcome', { name: user?.name || user?.email })}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              sseConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                sseConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                {sseConnected ? t('dashboard.status.connected') : t('dashboard.status.disconnected')}
              </span>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
              {t('dashboard.new_bot_button')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.stats.total_bots')}</p>
                <p className="text-3xl font-bold text-gray-800">{totalBots}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.stats.active_bots')}</p>
                <p className="text-3xl font-bold text-green-600">{connectedBots}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.stats.current_plan')}</p>
                <p className="text-3xl font-bold text-gray-800">
                  {/* Aquí podrías conectar el estado real de la suscripción */}
                  PRO
                </p>
                <Link to="/pricing" className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block">
                  {t('dashboard.stats.view_plans')}
                </Link>
              </div>
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Bot Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.create_bot.title')}</h2>
            
            <form onSubmit={handleCreateBot}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('dashboard.create_bot.name_label')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('dashboard.create_bot.name_placeholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('dashboard.create_bot.id_label')}
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('dashboard.create_bot.id_placeholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('dashboard.create_bot.prompt_label')}
                  </label>
                  <textarea
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder={t('dashboard.create_bot.prompt_placeholder')}
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {createLoading ? t('dashboard.create_bot.submit_creating') : t('dashboard.create_bot.submit')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg font-medium transition-colors"
                >
                  {t('dashboard.create_bot.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bots Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.my_bots')}</h2>
          <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-sm font-medium">
            {totalBots === 1 ? t('dashboard.bots_count', { count: totalBots }) : t('dashboard.bots_count_plural', { count: totalBots })}
          </span>
        </div>

        {totalBots === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200 border-dashed">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('dashboard.empty_state.title')}</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {t('dashboard.empty_state.description')}
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {t('dashboard.empty_state.button')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map(bot => (
              <div key={bot.id}>
                <BotCard bot={bot} />
                {user?.role === 'admin' && (
                  <div className="mt-4">
                    <details className="group">
                      <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-blue-600 hover:text-blue-800">
                        <span>{t('dashboard.manage_scoring', 'Manage Scoring Rules')}</span>
                        <span className="transition group-open:rotate-180">
                          <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                        </span>
                      </summary>
                      <div className="text-neutral-600 mt-3 group-open:animate-fadeIn">
                        <ScoringRulesManager botId={bot.id} />
                      </div>
                    </details>

                    <details className="group mt-2">
                      <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-blue-600 hover:text-blue-800">
                        <span>{t('dashboard.manage_products', 'Manage Products')}</span>
                        <span className="transition group-open:rotate-180">
                          <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                        </span>
                      </summary>
                      <div className="text-neutral-600 mt-3 group-open:animate-fadeIn">
                        <ProductManager botId={bot.id} />
                      </div>
                    </details>
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