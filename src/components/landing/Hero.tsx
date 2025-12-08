import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheck } from 'react-icons/fi';

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Nuevo: Integración con DeepSeek AI
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Automatiza tu WhatsApp y <span className="text-blue-600">Vende Más</span> 24/7
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Gestiona múltiples bots, califica leads automáticamente y cierra ventas mientras duermes. La plataforma todo-en-uno para potenciar tu negocio en WhatsApp.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <button className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 group">
                Comenzar Prueba Gratis
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 hover:border-blue-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl font-bold text-lg transition-all">
                Ver Demo
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FiCheck className="text-emerald-500 text-lg" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="text-emerald-500 text-lg" />
                <span>Configuración en 5 min</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="text-emerald-500 text-lg" />
                <span>Soporte 24/7</span>
              </div>
            </div>
          </motion.div>

          {/* Visual Content */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:w-1/2 relative"
          >
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 md:p-4">
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] relative flex items-center justify-center">
                {/* Abstract UI Representation */}
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
                
                <div className="relative w-full max-w-sm mx-auto space-y-4 p-6">
                  {/* Chat Bubble Left */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0"></div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-sm text-gray-600 w-3/4">
                      Hola, me gustaría información sobre sus servicios de automatización.
                    </div>
                  </div>

                  {/* Chat Bubble Right (Bot) */}
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-emerald-600">AI</div>
                    <div className="bg-blue-600 p-3 rounded-2xl rounded-tr-none shadow-md text-sm text-white w-3/4">
                      ¡Hola! Claro que sí. Ayudamos a empresas a automatizar sus ventas en WhatsApp. ¿Te gustaría ver una demo?
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end">
                    <div className="bg-emerald-50 text-emerald-600 text-xs px-3 py-1 rounded-full border border-emerald-100">
                      Lead Calificado ✅
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -z-10"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};