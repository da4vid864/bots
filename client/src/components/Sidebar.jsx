{/* MÉTRICAS DESTACADAS */}
<section className="mb-8 sm:mb-12">
  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
    Tu desempeño en tiempo real 📊
  </h2>

  {/* Solo tarjeta de Leads Totales */}
  <div className="grid grid-cols-1 max-w-md gap-4 sm:gap-6 mb-4 sm:mb-8">
    <div className="group p-4 sm:p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mb-1">
            Leads Totales
          </p>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {metrics.totalLeads.toLocaleString()}
          </p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <UsersIcon />
        </div>
      </div>
      <div className="mt-3 sm:mt-4">
        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            style={{ width: '65%' }}
          />
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-2">
          +12% desde el mes anterior
        </p>
      </div>
    </div>
  </div>

  <div className="text-center">
    <button className="inline-flex items-center px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors text-sm">
      Ver Reporte Completo →
    </button>
  </div>
</section>