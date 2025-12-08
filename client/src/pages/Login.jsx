import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Login = () => {
  const { login, loading, error, user } = useAuth();

  const handlePurchase = () => {
    window.location.href = '/subs/purchase/pro';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra de navegación */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={logo}
              alt="BotInteligente"
              className="h-9 w-auto"
            />
            <span className="font-semibold text-lg tracking-tight">
              BotInteligente
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <Link
                to="/dashboard"
                className="text-sm font-medium text-slate-200 hover:text-black transition-colors"
              >
                Panel
              </Link>
            )}

            {!user && (
              <button
                onClick={login}
                disabled={loading}
                className="text-sm font-medium text-slate-200 hover:text-black transition-colors disabled:opacity-60"
              >
                {loading ? 'Conectando…' : 'Iniciar sesión'}
              </button>
            )}

            <button
              onClick={handlePurchase}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-blue-500 transition-colors"
            >
              {user ? 'Mejorar plan' : 'Probar Pro'}
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Columna izquierda: texto / hero */}
            <div>
              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 ring-1 ring-inset ring-blue-500/30">
                Plataforma de automatización para WhatsApp
              </span>

              <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Automatiza tus conversaciones
                <span className="block text-blue-400">
                  con bots inteligentes en WhatsApp
                </span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl">
                BotInteligente conecta tu negocio con tus clientes las 24/7.
                Captura leads, responde preguntas frecuentes y cierra ventas de forma
                automática con asistentes impulsados por IA.
              </p>

              {/* CTA principal */}
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  onClick={handlePurchase}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm sm:text-base font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-colors"
                >
                  Comenzar prueba gratuita
                </button>

                {user ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-6 py-3 text-sm sm:text-base font-medium text-slate-100 hover:bg-slate-900/60 transition-colors"
                  >
                    Ir al panel
                  </Link>
                ) : (
                  <button
                    onClick={login}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-6 py-3 text-sm sm:text-base font-medium text-slate-100 hover:bg-slate-900/60 transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Conectando…' : 'Ver demo en vivo'}
                  </button>
                )}
              </div>

              {/* Beneficios rápidos */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-300">
                <div className="border border-slate-800 rounded-lg p-3">
                  <p className="font-semibold text-white text-sm">Implementación rápida</p>
                  <p className="mt-1 text-xs">
                    Conecta tu número de WhatsApp en minutos y empieza a automatizar.
                  </p>
                </div>
                <div className="border border-slate-800 rounded-lg p-3">
                  <p className="font-semibold text-white text-sm">Bots con IA</p>
                  <p className="mt-1 text-xs">
                    Respuestas naturales, contextuales y entrenadas para tu negocio.
                  </p>
                </div>
                <div className="border border-slate-800 rounded-lg p-3">
                  <p className="font-semibold text-white text-sm">Analítica en tiempo real</p>
                  <p className="mt-1 text-xs">
                    Mira leads, embudos de conversación y rendimiento de cada bot.
                  </p>
                </div>
              </div>
            </div>

            {/* Columna derecha: card de acceso */}
            <div className="w-full max-w-md mx-auto">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-white">
                  Accede a tu cuenta
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Usa tu cuenta para configurar bots, flujos de conversación y ver
                  resultados en tiempo real.
                </p>

                <div className="mt-6 space-y-4">
                  {/* Botón principal de login */}
                  <button
                    onClick={login}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Iniciando sesión…' : 'Iniciar sesión / Registrarse'}
                  </button>

                  {/* Opción Pro directa */}
                  <button
                    onClick={handlePurchase}
                    className="w-full inline-flex items-center justify-center rounded-lg border border-blue-500/60 px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-blue-500/10 transition-colors"
                  >
                    Ir directo al plan Pro
                  </button>

                  {/* Info plan Starter */}
                  <div className="mt-4 rounded-lg bg-slate-900 border border-slate-800 p-4 text-xs text-slate-300">
                    <p className="font-semibold text-white text-sm">
                      Plan Starter (Gratis)
                    </p>
                    <ul className="mt-2 space-y-1">
                      <li>• 1 bot activo</li>
                      <li>• 100 leads al mes</li>
                      <li>• Automatizaciones básicas</li>
                    </ul>
                    <p className="mt-3 text-[11px] text-slate-400">
                      Siempre puedes actualizar a Pro para bots y leads ilimitados,
                      analítica avanzada e IA mejorada.
                    </p>
                  </div>
                </div>

                {user && (
                  <div className="mt-6 text-xs text-green-400 bg-green-500/5 border border-green-500/40 rounded-lg px-3 py-2">
                    Sesión iniciada como: <span className="font-semibold">{user.email || user.name || 'usuario'}</span>
                    <p className="text-[11px] text-green-200/80 mt-1">
                      Ve al panel para gestionar tus bots y conversaciones.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer simple */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} BotInteligente. Todos los derechos reservados.</p>
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            <span className="hover:text-slate-300 cursor-pointer">Términos</span>
            <span className="hover:text-slate-300 cursor-pointer">Privacidad</span>
          </div>
        </div>
      </footer>

      {/* Toast de error */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900/90 text-red-50 border border-red-500/70 px-4 py-3 rounded-lg shadow-xl text-sm max-w-xs z-50">
          <p className="font-semibold text-red-100">Error al iniciar sesión</p>
          <p className="mt-1">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Login;