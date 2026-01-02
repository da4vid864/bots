import React from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { useUserPreferences } from '../../hooks/useUserPreferences';

/**
 * UserPreferencesModal - Modal para configurar preferencias de usuario
 */
export const UserPreferencesModal = ({ isOpen, onClose }) => {
  const { preferences, updatePreference, resetPreferences } = useUserPreferences();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Preferencias de Usuario"
      size="md"
    >
      <div className="space-y-6">
        {/* Vista por defecto */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Vista por Defecto
          </label>
          <select
            value={preferences.defaultView}
            onChange={(e) => updatePreference('defaultView', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="kanban">Kanban</option>
            <option value="grid">Grid</option>
            <option value="live">Tiempo Real</option>
          </select>
        </div>

        {/* Items por página */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Elementos por Página
          </label>
          <select
            value={preferences.itemsPerPage}
            onChange={(e) => updatePreference('itemsPerPage', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>

        {/* Modo compacto */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Modo Compacto
            </label>
            <p className="text-xs text-slate-400">
              Muestra más información en menos espacio
            </p>
          </div>
          <button
            onClick={() => updatePreference('compactMode', !preferences.compactMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.compactMode ? 'bg-blue-600' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={preferences.compactMode}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.compactMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Sidebar colapsado */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Sidebar Colapsado por Defecto
            </label>
            <p className="text-xs text-slate-400">
              Inicia con el sidebar oculto
            </p>
          </div>
          <button
            onClick={() => updatePreference('sidebarCollapsed', !preferences.sidebarCollapsed)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.sidebarCollapsed ? 'bg-blue-600' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={preferences.sidebarCollapsed}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={resetPreferences}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            Restablecer
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
};

UserPreferencesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default UserPreferencesModal;

