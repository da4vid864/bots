import React, { useState, useEffect } from 'react';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import BotCard from '../components/BotCard';
import { useSearchParams } from 'react-router-dom';

const Dashboard = () => {
  const { bots, createBot, sseConnected } = useBots();
  const { user } = useAuth();
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
        title: '¡Suscripción Activada!',
        message: 'Gracias por suscribirte al plan Pro. Disfruta de todas las funcionalidades.'
      });
      // Limpiar URL param opcionalmente
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      setNotification({
        type: 'info',
        title: 'Pago Cancelado',
        message: 'El proceso de pago fue cancelado. No se ha realizado ningún cobro.'
      });
    } else if (searchParams.get('error')) {
       setNotification({
        type: 'error',
        title: 'Error',
        message: 'Hubo un problema procesando tu solicitud.'
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
      alert('Por favor completa todos los campos');
      return;
    }

    setCreateLoading(true);
    try {
      await createBot(formData);
      setFormData({ name: '', id: '', prompt: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creando bot:', error);
      alert('Error al crear el bot. Inténtalo de nuevo.');
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
            <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
            <p className="text-gray-600">Bienvenido, {user?.name || user?.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              sseConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                sseConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                {sseConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
              + Nuevo Bot
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bots</p>
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
                <p className="text-sm font-medium text-gray-600">Bots Activos</p>
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
                <p className="text-sm font-medium text-gray-600">Plan Actual</p>
                <p className="text-3xl font-bold text-gray-800">
                  {/* Aquí podrías conectar el estado real de la suscripción */}
                  PRO
                </p>
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
            <h2 className="text-xl font-bold text-gray-800 mb-4">Configurar Nuevo Bot</h2>
            
            <form onSubmit={handleCreateBot}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Bot
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Asistente de Ventas"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Único
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ej: bot-ventas-01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt del Sistema (IA)
                  </label>
                  <textarea
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Instrucciones para la IA (ej: Eres un vendedor amable...)"
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
                  {createLoading ? 'Creando...' : 'Crear Bot'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bots Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Mis Bots</h2>
          <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-sm font-medium">
            {totalBots} {totalBots === 1 ? 'bot' : 'bots'}
          </span>
        </div>

        {totalBots === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200 border-dashed">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Comienza tu automatización</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Crea tu primer bot de WhatsApp para empezar a atender clientes y capturar leads automáticamente.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Crear Primer Bot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map(bot => (
              <BotCard key={bot.id} bot={bot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;