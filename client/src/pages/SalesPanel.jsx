import React from 'react';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import CustomerJourneyKanban from '../components/CustomerJourneyKanban';
import { useTranslation } from 'react-i18next';

const LeadsIcon = () => (
  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h7v-2c0-.7.1-1.37.29-2H8zm8 0c-.29 0-.62.02-.97.05C16.1 13.63 16 14.3 16 15v4h7v-2.5C23 14.17 18.33 13 16 13z" />
  </svg>
);

const AssignedIcon = () => (
  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const UnassignedIcon = () => (
  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 1a9 9 0 100 18 9 9 0 000-18zm1 13h-2v-2h2v2zm0-4h-2V5h2v5z" />
  </svg>
);

const SalesPanel = () => {
  const { leads, sseConnected } = useBots();
  const { user } = useAuth();
  const { t } = useTranslation();

  const assignedLeads = leads.filter((lead) => lead.assigned_to === user?.email).length;
  const totalLeads = leads.length;
  const unassignedLeads = leads.filter((lead) => !lead.assigned_to).length;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {t('sales_panel.title')}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">
              {t('sales_panel.subtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                sseConnected
                  ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                  : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              {sseConnected
                ? t('sales_panel.status.connected')
                : t('sales_panel.status.disconnected')}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="group p-4 sm:p-5 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/60 to-slate-950 hover:border-blue-500/40 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-400 mb-1">
                  {t('sales_panel.stats.total_leads')}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {totalLeads}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <LeadsIcon />
              </div>
            </div>
          </div>

          <div className="group p-4 sm:p-5 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/60 to-slate-950 hover:border-emerald-500/40 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-400 mb-1">
                  {t('sales_panel.stats.assigned_to_you')}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {assignedLeads}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AssignedIcon />
              </div>
            </div>
          </div>

          <div className="group p-4 sm:p-5 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/60 to-slate-950 hover:border-amber-500/40 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-400 mb-1">
                  {t('sales_panel.stats.unassigned')}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-amber-400">
                  {unassignedLeads}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UnassignedIcon />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <CustomerJourneyKanban />
      </main>
    </div>
  );
};

export default SalesPanel;
