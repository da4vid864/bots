import React from 'react';
import PropTypes from 'prop-types';

export const Input = ({
    label,
    error,
    type = 'text',
    placeholder = '',
    value,
    onChange,
    id,
    name,
    className = '',
    ...props
}) => {
    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label 
                    htmlFor={inputId} 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    id={inputId}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`
                        block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
                        dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500
                        dark:focus:ring-blue-500 dark:focus:border-blue-500
                        ${error 
                            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500 dark:border-red-500 dark:text-red-300' 
                            : 'border-gray-300'
                        }
                    `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
};

Input.propTypes = {
    label: PropTypes.string,
    error: PropTypes.string,
    type: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    id: PropTypes.string,
    name: PropTypes.string,
    className: PropTypes.string
};

export default Input;