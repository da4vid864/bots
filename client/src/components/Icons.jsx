import React from 'react';

export const AddIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
);

export const CloseIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
);

export const CheckCircleIcon = () => (
    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
);

export const WarningIcon = () => (
    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
);

export const InfoIcon = () => (
    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
);

export const ErrorIcon = () => (
    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
);

export const SmartToyIcon = (props) => (
    <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>
    </svg>
);

export const FlashOnIcon = (props) => (
    <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
    </svg>
);

export const DiamondIcon = (props) => (
    <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M12 2L5 12l7 10 7-10z"/>
    </svg>
);

export const ExpandMoreIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
    </svg>
);

export const ExpandLessIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
    </svg>
);

export const StarsIcon = () => (
    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/>
    </svg>
);

export const InventoryIcon = () => (
    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z"/>
    </svg>
);

export const AutoAwesomeIcon = () => (
    <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
    </svg>
);
