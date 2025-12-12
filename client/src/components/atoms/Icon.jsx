import React from 'react';
import PropTypes from 'prop-types';

const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
};

const variants = {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    danger: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-500 dark:text-yellow-400',
    ghost: 'text-current'
};

export const Icon = ({ 
    children, 
    size = 'md', 
    variant = 'ghost',
    className = '',
    ...props 
}) => {
    const sizeClass = sizes[size] || sizes.md;
    const variantClass = variants[variant] || variants.ghost;

    return (
        <span 
            className={`inline-flex items-center justify-center ${sizeClass} ${variantClass} ${className}`}
            role="img"
            aria-hidden="true"
            {...props}
        >
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // We attempt to force the child to fill the container
                    // Note: If the child component does not accept className, this might fail to resize the SVG itself
                    // but the span wrapper will constrain layout.
                    return React.cloneElement(child, { 
                        className: 'w-full h-full fill-current' 
                    });
                }
                return child;
            })}
        </span>
    );
};

Icon.propTypes = {
    children: PropTypes.node.isRequired,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
    variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'warning', 'ghost']),
    className: PropTypes.string
};

export default Icon;