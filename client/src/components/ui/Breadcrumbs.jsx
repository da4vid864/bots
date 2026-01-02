import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * Breadcrumbs - Componente de migas de pan para navegación
 * Accesible y responsive
 */
export const Breadcrumbs = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center space-x-2 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-2" itemScope itemType="https://schema.org/BreadcrumbList">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li 
              key={index}
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {isLast ? (
                <span
                  className="text-slate-400 font-medium"
                  itemProp="name"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <>
                  {item.to ? (
                    <Link
                      to={item.to}
                      className="text-slate-300 hover:text-white transition-colors"
                      itemProp="item"
                    >
                      <span itemProp="name">{item.label}</span>
                    </Link>
                  ) : (
                    <span className="text-slate-300" itemProp="name">
                      {item.label}
                    </span>
                  )}
                  <svg
                    className="w-4 h-4 text-slate-500 mx-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
              <meta itemProp="position" content={index + 1} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string
    })
  ).isRequired,
  className: PropTypes.string
};

export default Breadcrumbs;

