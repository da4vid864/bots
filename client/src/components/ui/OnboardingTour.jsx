import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useUserPreferences } from '../../hooks/useUserPreferences';

/**
 * OnboardingTour - Tour interactivo para nuevos usuarios
 * Guía paso a paso por las funcionalidades principales
 */
export const OnboardingTour = ({ steps = [], onComplete, onSkip }) => {
  const { preferences, updatePreference } = useUserPreferences();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar tour solo si no se ha completado antes
    const hasCompletedTour = localStorage.getItem('onboarding_completed');
    if (!hasCompletedTour && steps.length > 0) {
      setIsVisible(true);
    }
  }, [steps.length]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    updatePreference('onboardingCompleted', true);
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const stepElement = step.target ? document.querySelector(step.target) : null;
  const rect = stepElement?.getBoundingClientRect();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Highlight del elemento objetivo */}
      {stepElement && rect && (
        <div
          className="fixed z-50 border-2 border-blue-500 rounded-lg pointer-events-none"
          style={{
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
          }}
        />
      )}

      {/* Tooltip del tour */}
      <div
        className="fixed z-50 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl shadow-2xl p-6 max-w-sm"
        style={{
          left: step.position?.left || '50%',
          top: step.position?.top || '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">
              {step.title}
            </h3>
            <p className="text-sm text-slate-400">
              Paso {currentStep + 1} de {steps.length}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Saltar tour"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-slate-300 mb-6">
          {step.content}
        </p>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            >
              Anterior
            </button>
          )}
          <button
            onClick={currentStep === steps.length - 1 ? handleComplete : handleNext}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-colors"
          >
            {currentStep === steps.length - 1 ? 'Comenzar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </>
  );
};

OnboardingTour.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      target: PropTypes.string, // CSS selector
      title: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      position: PropTypes.shape({
        left: PropTypes.string,
        top: PropTypes.string
      })
    })
  ),
  onComplete: PropTypes.func,
  onSkip: PropTypes.func
};

// Pasos predefinidos para el onboarding
export const defaultOnboardingSteps = [
  {
    target: '[data-tour="dashboard"]',
    title: 'Bienvenido a BotInteligente',
    content: 'Este es tu dashboard principal. Aquí puedes gestionar todos tus bots de WhatsApp.',
    position: { left: '50%', top: '50%' }
  },
  {
    target: '[data-tour="create-bot"]',
    title: 'Crea tu primer bot',
    content: 'Haz clic aquí para crear y configurar tu primer bot inteligente en menos de 5 minutos.',
    position: { left: '50%', top: '50%' }
  },
  {
    target: '[data-tour="sales-panel"]',
    title: 'Panel de Ventas',
    content: 'Gestiona tus leads y conversaciones desde el panel de ventas. Organiza por categorías y asigna a tu equipo.',
    position: { left: '50%', top: '50%' }
  }
];

export default OnboardingTour;

