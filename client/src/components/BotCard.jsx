import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useBots } from '../context/BotsContext';
import LoadingSpinner from './ui/LoadingSpinner';

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
    if (window.confirm(`¿Estás seguro de que quieres eliminar el bot "${bot.name}"?`)) {
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
    if (status === 'disabled') return 'bg-slate-500';
    if (runtimeStatus === 'CONNECTED') return 'bg-green-500';
    if (runtimeStatus === 'PENDING_QR') return 'bg-yellow-500';
    if (runtimeStatus === 'DISCONNECTED') return 'bg-red-500';
    if (runtimeStatus === 'STARTING') return 'bg-blue-500';
    return 'bg-slate-500';
  };

  const getStatusText = (status, runtimeStatus) => {
    if (status === 'disabled') return 'Deshabilitado';
    if (runtimeStatus === 'CONNECTED') return 'Conectado';
    if (runtimeStatus === 'PENDING_QR') return 'Escanea QR';
    if (runtimeStatus === 'DISCONNECTED') return 'Desconectado';
    if (runtimeStatus === 'STARTING') return 'Iniciando...';
    return 'Desconocido';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 rounded-xl border border-slate-800 p-6 hover:border-slate-700 transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{bot.name}</h3>
          <p className="text-sm text-slate-400">ID: {bot.id}</p>
        </div>
        <div className="flex items-center space-x-2" role="status" aria-label={`Estado: ${getStatusText(bot.status, bot.runtimeStatus)}`}>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(bot.status, bot.runtimeStatus)} animate-pulse`} aria-hidden="true"></div>
          <span className="text-sm font-medium text-slate-300">
            {getStatusText(bot.status, bot.runtimeStatus)}
          </span>
        </div>
      </div>

      {bot.qr && bot.runtimeStatus === 'PENDING_QR' && (
        <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-300 mb-2">Escanea este código QR con WhatsApp:</p>
          <img 
            src={bot.qr} 
            alt="Código QR de WhatsApp para conectar el bot" 
            className="mx-auto w-48 h-48 border border-slate-700 rounded-lg"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-1">Prompt:</label>
        {isEditing ? (
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-md text-sm resize-none text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            placeholder="Ingresa el prompt del bot..."
            aria-label="Prompt del bot"
          />
        ) : (
          <p className="text-sm text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-700">
            {bot.prompt || 'No prompt configurado'}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleEnableDisable}
          disabled={loading}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            bot.status === 'enabled' 
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white' 
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500`}
          aria-label={bot.status === 'enabled' ? 'Deshabilitar bot' : 'Habilitar bot'}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Cargando...
            </span>
          ) : (
            bot.status === 'enabled' ? 'Deshabilitar' : 'Habilitar'
          )}
        </button>

        <button
          onClick={handleEdit}
          disabled={loading}
          className="flex-1 min-w-[100px] py-2 px-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
          aria-label={isEditing ? 'Guardar cambios' : 'Editar bot'}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Cargando...
            </span>
          ) : (
            isEditing ? 'Guardar' : 'Editar'
          )}
        </button>

        {!isEditing && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 min-w-[100px] py-2 px-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-500"
            aria-label="Eliminar bot"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Cargando...
              </span>
            ) : (
              'Eliminar'
            )}
          </button>
        )}

        {isEditing && (
          <button
            onClick={() => {
              setIsEditing(false);
              setEditPrompt(bot.prompt || '');
            }}
            className="flex-1 min-w-[100px] py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500"
            aria-label="Cancelar edición"
          >
            Cancelar
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-slate-500 border-t border-slate-800 pt-4">
        <p>Puerto: {bot.port}</p>
        <p>Propietario: {bot.ownerEmail}</p>
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