import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'botinteligente_user_preferences';

/**
 * Hook para manejar preferencias de usuario
 * Persiste en localStorage
 */
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        theme: 'dark',
        sidebarCollapsed: false,
        kanbanColumnOrder: [],
        kanbanColumnWidths: {},
        defaultView: 'kanban',
        itemsPerPage: 50,
        compactMode: false
      };
    } catch (error) {
      console.error('Error loading preferences:', error);
      return {
        theme: 'dark',
        sidebarCollapsed: false,
        kanbanColumnOrder: [],
        kanbanColumnWidths: {},
        defaultView: 'kanban',
        itemsPerPage: 50,
        compactMode: false
      };
    }
  });

  // Guardar preferencias en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [preferences]);

  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    const defaultPrefs = {
      theme: 'dark',
      sidebarCollapsed: false,
      kanbanColumnOrder: [],
      kanbanColumnWidths: {},
      defaultView: 'kanban',
      itemsPerPage: 50,
      compactMode: false
    };
    setPreferences(defaultPrefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPrefs));
    } catch (error) {
      console.error('Error resetting preferences:', error);
    }
  }, []);

  return {
    preferences,
    updatePreference,
    resetPreferences
  };
};

export default useUserPreferences;

