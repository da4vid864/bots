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
                    className="block text-sm font-medium text-slate-300 mb-1"
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
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    className={`
                        block w-full px-3 py-2.5 sm:py-2 bg-slate-800/50 border rounded-lg shadow-sm 
                        text-white placeholder-slate-500 text-base sm:text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        disabled:bg-slate-800/30 disabled:text-slate-500 disabled:cursor-not-allowed
                        transition-colors duration-200
                        ${error 
                            ? 'border-red-500/50 text-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-slate-700'
                        }
                    `}
                    {...props}
                />
            </div>
            {error && (
                <p id={`${inputId}-error`} className="mt-1 text-sm text-red-400" role="alert" aria-live="polite">
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