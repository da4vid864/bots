import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useBots } from '../context/BotsContext';

/**
 * Component to display and manage a single bot instance.
 * Allows enabling/disabling, editing the prompt, and deleting the bot.
 * Displays connection status and QR code if pending authentication.
 *
 * @component
 * @param {object} props - Component props
 * @param {object} props.bot - The bot object containing details like id, name, status, etc.
 * @param {number|string} props.bot.id - Unique identifier for the bot.
 * @param {string} props.bot.name - Name of the bot.
 * @param {string} props.bot.status - Current configured status ('enabled' or 'disabled').
 * @param {string} [props.bot.runtimeStatus] - Current runtime status (e.g., 'CONNECTED', 'PENDING_QR').
 * @param {string} [props.bot.qr] - Base64 encoded QR code image if status is 'PENDING_QR'.
 * @param {string} [props.bot.prompt] - System prompt for the bot.
 * @param {number|string} [props.bot.port] - Port number the bot is running on.
 * @param {string} [props.bot.ownerEmail] - Email of the bot owner.
 * @returns {JSX.Element} The rendered BotCard component.
 */
const BotCard = ({ bot }) => {
  const { enableBot, disableBot, deleteBot, editBot } = useBots();
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState(bot.prompt || '');
  const [loading, setLoading] = useState(false);

  const handleEnableDisable = async () => {
    setLoading(true);
    try {
      if (bot.status === 'enabled') {
        await disableBot(bot.id);
      } else {
        await enableBot(bot.id);
      }
    } catch (error) {
      console.error('Error toggling bot status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete bot "${bot.name}"?`)) {
      setLoading(true);
      try {
        await deleteBot(bot.id);
      } catch (error) {
        console.error('Error deleting bot:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = async () => {
    if (isEditing) {
      setLoading(true);
      try {
        await editBot(bot.id, editPrompt);
        setIsEditing(false);
      } catch (error) {
        console.error('Error editing bot:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const getStatusColor = (status, runtimeStatus) => {
    if (status === 'disabled') return 'bg-gray-500';
    if (runtimeStatus === 'CONNECTED') return 'bg-green-500';
    if (runtimeStatus === 'PENDING_QR') return 'bg-yellow-500';
    if (runtimeStatus === 'DISCONNECTED') return 'bg-red-500';
    if (runtimeStatus === 'STARTING') return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getStatusText = (status, runtimeStatus) => {
    if (status === 'disabled') return 'Disabled';
    if (runtimeStatus === 'CONNECTED') return 'Connected';
    if (runtimeStatus === 'PENDING_QR') return 'Scan QR Code';
    if (runtimeStatus === 'DISCONNECTED') return 'Disconnected';
    if (runtimeStatus === 'STARTING') return 'Starting...';
    return 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{bot.name}</h3>
          <p className="text-sm text-gray-600">ID: {bot.id}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(bot.status, bot.runtimeStatus)}`}></div>
          <span className="text-sm font-medium text-gray-700">
            {getStatusText(bot.status, bot.runtimeStatus)}
          </span>
        </div>
      </div>

      {bot.qr && bot.runtimeStatus === 'PENDING_QR' && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Scan this QR code with WhatsApp:</p>
          <img 
            src={bot.qr} 
            alt="WhatsApp QR Code" 
            className="mx-auto w-48 h-48 border border-gray-300 rounded"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Prompt:</label>
        {isEditing ? (
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
            rows="3"
            placeholder="Enter bot prompt..."
          />
        ) : (
          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
            {bot.prompt || 'No prompt set'}
          </p>
        )}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handleEnableDisable}
          disabled={loading}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
            bot.status === 'enabled' 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50`}
        >
          {loading ? '...' : bot.status === 'enabled' ? 'Disable' : 'Enable'}
        </button>

        <button
          onClick={handleEdit}
          disabled={loading}
          className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
        >
          {loading ? '...' : isEditing ? 'Save' : 'Edit'}
        </button>

        {!isEditing && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
          >
            {loading ? '...' : 'Delete'}
          </button>
        )}

        {isEditing && (
          <button
            onClick={() => {
              setIsEditing(false);
              setEditPrompt(bot.prompt || '');
            }}
            className="flex-1 py-2 px-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Port: {bot.port}</p>
        <p>Owner: {bot.ownerEmail}</p>
      </div>
    </div>
  );
};

BotCard.propTypes = {
  bot: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    runtimeStatus: PropTypes.string,
    qr: PropTypes.string,
    prompt: PropTypes.string,
    port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ownerEmail: PropTypes.string,
  }).isRequired,
};

export default BotCard;