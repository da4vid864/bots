import React, { createContext, useState, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [toast, setToast] = useState(null);

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const showToast = useCallback((type, message) => {
        setToast({ type, message });
        // Auto dismiss after 3 seconds
        setTimeout(() => {
            setToast(null);
        }, 3000);
    }, []);

    const value = {
        isSidebarOpen,
        toggleSidebar,
        toast,
        showToast
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

UIProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};