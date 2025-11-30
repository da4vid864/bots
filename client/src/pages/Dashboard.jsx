import React, { useState } from 'react';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import BotCard from '../components/BotCard';

const Dashboard = () => {
  const { bots, createBot, sseConnected } = useBots();
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    prompt: ''
  });

  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.id || !formData.prompt) {
      alert('Please fill in all fields');
      return;
    }

    setCreateLoading(true);
    try {
      await createBot(formData);
      setFormData({ name: '', id: '', prompt: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating bot:', error);
      alert('Failed to create bot. Please try again.');
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              sseConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                sseConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm">
                {sseConnected ? 'Real-time Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              + Create Bot
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bots</p>
                <p className="text-3xl font-bold text-gray-800">{totalBots}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected Bots</p>
                <p className="text-3xl font-bold text-green-600">{connectedBots}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-3xl font-bold text-gray-800">
                  {totalBots === 0 ? 'No Bots' : 'Active'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Bot Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Bot</h2>
            
            <form onSubmit={handleCreateBot}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bot name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bot ID
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter unique bot ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt
                  </label>
                  <textarea
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Enter the AI prompt for this bot"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Bot'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bots Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Bots</h2>
          <p className="text-gray-600">
            {totalBots} bot{totalBots !== 1 ? 's' : ''} total
          </p>
        </div>

        {totalBots === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Bots Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first WhatsApp bot to get started with automated conversations.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Create Your First Bot
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