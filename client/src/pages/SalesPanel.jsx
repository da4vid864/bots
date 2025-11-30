import React from 'react';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import ChatInterface from '../components/ChatInterface';

const SalesPanel = () => {
  const { leads, sseConnected } = useBots();
  const { user } = useAuth();

  const assignedLeads = leads.filter(lead => lead.assigned_to === user?.email).length;
  const totalLeads = leads.length;
  const unassignedLeads = leads.filter(lead => !lead.assigned_to).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Sales Panel</h1>
            <p className="text-gray-600">Manage and interact with qualified leads</p>
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
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Leads</p>
                <p className="text-2xl font-bold text-blue-800">{totalLeads}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Assigned to You</p>
                <p className="text-2xl font-bold text-green-800">{assignedLeads}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Unassigned</p>
                <p className="text-2xl font-bold text-yellow-800">{unassignedLeads}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-lg">⏳</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-md h-full">
          <ChatInterface />
        </div>
      </div>

      {/* Instructions */}
      {totalLeads === 0 && (
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Leads Available</h3>
            <p className="text-gray-600 mb-4">
              Qualified leads will appear here automatically when users interact with your WhatsApp bots.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-left max-w-2xl mx-auto">
              <div className="bg-white p-4 rounded border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-green-500">✅</span>
                  <span className="font-medium">Bot Interactions</span>
                </div>
                <p className="text-gray-600 text-xs">
                  Users must interact with your WhatsApp bots to generate qualified leads.
                </p>
              </div>
              <div className="bg-white p-4 rounded border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-blue-500">🤖</span>
                  <span className="font-medium">Lead Qualification</span>
                </div>
                <p className="text-gray-600 text-xs">
                  Bots automatically qualify leads based on conversation patterns and user intent.
                </p>
              </div>
              <div className="bg-white p-4 rounded border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-purple-500">🚀</span>
                  <span className="font-medium">Real-time Updates</span>
                </div>
                <p className="text-gray-600 text-xs">
                  New leads appear instantly via real-time connection to the server.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPanel;