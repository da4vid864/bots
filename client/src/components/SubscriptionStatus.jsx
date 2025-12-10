import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * SubscriptionStatus Component
 * 
 * Displays the current subscription status, trial days remaining, and bot/lead limits
 * Fetches subscription info from /subs/status endpoint
 */
const SubscriptionStatus = ({ userEmail, onTrialExpired, onUpgradeNeeded }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch subscription status on component mount
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/subs/status', {
          withCredentials: true,
          timeout: 5000
        });

        if (response.data.success) {
          setSubscription(response.data.subscription);
          
          // Trigger callback if trial is expired
          if (response.data.subscription.status === 'active' && 
              response.data.subscription.currentPlan === 'free' &&
              onTrialExpired) {
            onTrialExpired();
          }
        }
      } catch (err) {
        console.error('Failed to fetch subscription status:', err);
        setError('No se pudo cargar el estado de suscripción');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();

    // Recheck subscription every 30 seconds to detect trial expiration
    const interval = setInterval(fetchSubscriptionStatus, 30 * 1000);
    return () => clearInterval(interval);
  }, [userEmail, onTrialExpired]);

  if (loading) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 animate-pulse">
        <div className="h-4 bg-slate-600 rounded w-3/4"></div>
      </div>
    );
  }

  if (error || !subscription) {
    return null; // Silently fail - don't block UI
  }

  const { 
    currentPlan, 
    status, 
    botLimit, 
    leadsLimit, 
    isTrialActive, 
    trialDaysLeft,
    trialEndsAt,
    trialUsedOnce
  } = subscription;

  // Trial active banner
  if (isTrialActive && trialDaysLeft > 0) {
    return (
      <div className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-300">
              ✨ Plan Pro - Trial Gratuito (Sin tarjeta)
            </p>
            <p className="text-xs text-blue-200 mt-1">
              {trialDaysLeft === 1 
                ? 'Último día del trial' 
                : `${trialDaysLeft} días restantes`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-200">Vence: {new Date(trialEndsAt).toLocaleDateString('es-MX')}</p>
          </div>
        </div>

        {/* Trial features preview */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-900/50 p-2 rounded border border-blue-500/20">
            <p className="text-blue-300 font-semibold">Bots</p>
            <p className="text-blue-100">Ilimitados</p>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-blue-500/20">
            <p className="text-blue-300 font-semibold">Leads</p>
            <p className="text-blue-100">Ilimitados</p>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-blue-500/20">
            <p className="text-blue-300 font-semibold">IA</p>
            <p className="text-blue-100">Avanzada</p>
          </div>
        </div>

        {trialDaysLeft <= 3 && (
          <div className="pt-2 border-t border-blue-500/20">
            <p className="text-xs text-amber-300">
              ⚠️ Tu trial vence pronto. Actualiza a plan Pro para mantener la funcionalidad.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Free plan info
  if (currentPlan === 'free') {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-300">
            Plan Starter (Gratuito)
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Perfecto para empezar sin inversión
          </p>
        </div>

        {/* Free tier limits */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/50 p-2 rounded border border-slate-600">
            <p className="text-slate-400 font-semibold">Bots activos</p>
            <p className="text-slate-200">{botLimit === 1 ? '1 máximo' : 'Ilimitados'}</p>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-600">
            <p className="text-slate-400 font-semibold">Leads/mes</p>
            <p className="text-slate-200">{leadsLimit}/máximo</p>
          </div>
        </div>

        {/* Upgrade CTA */}
        {!trialUsedOnce && (
          <div className="pt-2 border-t border-slate-700">
            <a 
              href="/subs/purchase/pro"
              className="block w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-bold rounded text-center transition-all transform hover:scale-105 active:scale-95"
            >
              Comenzar Trial Pro (14 días)
            </a>
          </div>
        )}
      </div>
    );
  }

  // Paid plan info
  if (currentPlan === 'pro' && status === 'active') {
    return (
      <div className="p-4 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-lg border border-emerald-500/30">
        <div>
          <p className="text-sm font-semibold text-emerald-300">
            ✅ Plan Pro Activo
          </p>
          <p className="text-xs text-emerald-200 mt-1">
            Acceso completo a todas las características
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mt-3">
          <div className="bg-slate-900/50 p-2 rounded border border-emerald-500/20">
            <p className="text-emerald-300 font-semibold">Bots</p>
            <p className="text-emerald-100">Ilimitados</p>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-emerald-500/20">
            <p className="text-emerald-300 font-semibold">Leads</p>
            <p className="text-emerald-100">Ilimitados</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SubscriptionStatus;
