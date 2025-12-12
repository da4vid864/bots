import React from 'react';
import PropTypes from 'prop-types';

export const H1 = ({ children, className = '', ...props }) => {
    return (
        <h1 
            className={`text-3xl md:text-4xl font-bold text-gray-900 dark:text-white ${className}`} 
            {...props}
        >
            {children}
        </h1>
    );
};

H1.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export const H2 = ({ children, className = '', ...props }) => {
    return (
        <h2 
            className={`text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100 ${className}`} 
            {...props}
        >
            {children}
        </h2>
    );
};

H2.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export const Body = ({ children, className = '', ...props }) => {
    return (
        <p 
            className={`text-base text-gray-600 dark:text-gray-300 ${className}`} 
            {...props}
        >
            {children}
        </p>
    );
};

Body.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};