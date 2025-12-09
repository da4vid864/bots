import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet';
import logo from '../assets/logo.png';

const Login = () => {
  const { login, loading, error, user } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const handlePurchase = () => {
    window.location.href = '/subs/purchase/pro';
  };

  // Redirigir si ya está logueado
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const faqs = [
    {
      q: '¿Cuánto tiempo toma configurar un bot?',
      a: 'Solo 5 minutos. Conecta tu WhatsApp, carga tu información y listo. Sin código, sin complicaciones.'
    },
    {
      q: '¿Necesito tarjeta de crédito para la prueba?',
      a: 'No. Prueba 14 días completamente gratis. Sin tarjeta, sin sorpresas al final.'
    },
    {
      q: '¿Puedo cancelar en cualquier momento?',
      a: 'Sí, total libertad. Puedes cancelar tu suscripción Pro en cualquier momento desde tu panel.'
    },
    {
      q: '¿Qué pasa después de los 14 días?',
      a: 'Elige entre mantener tu plan Starter gratis (limitado) o actualizar a Pro. Tú controlas.'
    },
    {
      q: '¿BotInteligente funciona en todos los países?',
      a: 'Sí. Soportamos WhatsApp Business en más de 180 países. Verifica tu región en la prueba.'
    },
    {
      q: '¿Mis leads están seguros?',
      a: 'Total seguridad: encriptación end-to-end, cumplimiento GDPR, backups automáticos. Tu datos, tu control.'
    }
  ];

  const testimonials = [
    {
      name: 'Carlos Mendoza',
      company: 'MendozaTech',
      text: 'Pasamos de 20 a 500 leads mensuales en 2 meses. BotInteligente es un game changer.',
      avatar: '👨‍💼'
    },
    {
      name: 'María González',
      company: 'Ventas Premium MX',
      text: 'El bot maneja el 80% de mis consultas. Ahora enfoco en cerrar ventas, no en responder mensajes.',
      avatar: '👩‍💼'
    },
    {
      name: 'Juan López',
      company: 'E-Commerce Store',
      text: 'ROI de 350% en 3 meses. Mejor inversión que hice para mi negocio.',
      avatar: '🧑‍💼'
    }
  ];

  const features = [
    {
      icon: '⚡',
      title: 'Setup en 5 minutos',
      desc: 'Conecta WhatsApp y empieza. Sin código, sin IT, sin estrés.'
    },
    {
      icon: '🤖',
      title: 'IA entrenada para ti',
      desc: 'Tu bot aprende tu negocio. Respuestas que parecen humanas.'
    },
    {
      icon: '📊',
      title: 'Analítica que importa',
      desc: 'Ve cuántos leads capturas, cuántos conviertes, dónde optimizar.'
    },
    {
      icon: '🔒',
      title: '100% Seguro',
      desc: 'GDPR compliant, encriptación end-to-end, tus datos, tú controlas.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Automatiza WhatsApp con IA | Prueba 14 Días Gratis</title>
        <meta name="description" content="De 0 a 500+ leads/mes con bots inteligentes en WhatsApp. Prueba BotInteligente 14 días gratis, sin tarjeta. Setup en 5 minutos, IA entrenada para tu negocio." />
        <meta name="keywords" content="WhatsApp bot, automatización WhatsApp, IA chatbot, generador leads, CRM WhatsApp, bot inteligente, automatización negocios" />
        <meta property="og:title" content="Automatiza WhatsApp con IA | BotInteligente" />
        <meta property="og:description" content="Captura 500+ leads/mes automáticamente. Prueba 14 días gratis." />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* ==================== NAVEGACIÓN MEJORADA ==================== */}
        <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="BotInteligente" className="h-8 w-auto" />
              <span className="font-bold text-lg text-white">BotInteligente</span>
            </div>

            <div className="hidden sm:flex items-center space-x-1 text-sm">
              <a href="#features" className="px-3 py-2 rounded-md text-slate-300 hover:text-white transition-colors">Características</a>
              <a href="#pricing" className="px-3 py-2 rounded-md text-slate-300 hover:text-white transition-colors">Planes</a>
              <a href="#faq" className="px-3 py-2 rounded-md text-slate-300 hover:text-white transition-colors">FAQ</a>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handlePurchase}
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
              >
                Obtener Pro
              </button>
            </div>
          </div>
        </nav>

        {/* ==================== HERO SECTION ==================== */}
        <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 lg:pt-28 lg:pb-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Hero Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-full bg-blue-500/10 px-4 py-1 text-xs font-semibold text-blue-400 ring-1 ring-blue-500/20">
                    🚀 Nuevo: Prueba 14 días GRATIS
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                    De 0 a 500+ leads
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                      con bots inteligentes
                    </span>
                  </h1>

                  <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
                    WhatsApp es donde están tus clientes. BotInteligente es donde creces. Automatiza conversaciones, captura leads 24/7 y convierte más sin levantar un dedo.
                  </p>
                </div>

                {/* CTA Principal */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={handlePurchase}
                    className="group relative px-8 py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>Comenzar Prueba Gratuita</span>
                      <span className="text-xl">→</span>
                    </span>
                    <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </button>

                  <button
                    onClick={login}
                    disabled={loading}
                    className="px-8 py-4 rounded-xl font-bold text-lg border-2 border-slate-700 text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Conectando...' : 'Ya tengo cuenta'}
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 text-sm text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 font-bold text-lg">✓</span>
                    <span>Sin tarjeta de crédito</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 font-bold text-lg">✓</span>
                    <span>Cancela en cualquier momento</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 font-bold text-lg">✓</span>
                    <span>5 minutos de setup</span>
                  </div>
                </div>

                {/* Urgencia/Escasez */}
                <div className="inline-block bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg">
                  <p className="text-sm text-amber-200">
                    <span className="font-bold">⏰ Oferta limitada:</span> Últimos 10 spots gratuitos de setup personalizado
                  </p>
                </div>
              </div>

              {/* Hero Visual */}
              <div className="relative h-96 sm:h-96 lg:h-full lg:min-h-96 bg-gradient-to-br from-slate-900/50 to-slate-950 rounded-2xl border border-slate-800 p-8 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 opacity-50"></div>
                <div className="relative z-10 text-center space-y-4">
                  <div className="text-6xl">💬</div>
                  <h3 className="text-xl font-bold text-white">Tu Bot Inteligente</h3>
                  <p className="text-sm text-slate-400">Responde en segundos, convierte leads</p>
                  <div className="pt-4 space-y-2 text-left text-sm">
                    <div className="bg-slate-800/50 rounded p-3 text-slate-300">
                      <span className="text-blue-400 font-semibold">Bot:</span> Hola! ¿En qué puedo ayudarte hoy?
                    </div>
                    <div className="bg-slate-700/50 rounded p-3 text-slate-300">
                      <span className="text-green-400 font-semibold">Cliente:</span> Quiero conocer el plan Pro
                    </div>
                    <div className="bg-slate-800/50 rounded p-3 text-slate-300">
                      <span className="text-blue-400 font-semibold">Bot:</span> ¡Excelente! Te envío detalles...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== FEATURES TRANSFORMACIONALES ==================== */}
        <section id="features" className="py-20 border-t border-slate-800 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                ¿Por qué BotInteligente?
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Herramientas diseñadas para crecer tu negocio, no para aprender a usarlas
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="group p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-blue-500/30 hover:bg-slate-900/80 transition-all duration-300">
                  <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Métricas de Impacto */}
            <div className="grid md:grid-cols-3 gap-8 mt-16 pt-16 border-t border-slate-800">
              <div className="text-center">
                <div className="text-5xl font-black text-blue-400">500%</div>
                <p className="text-slate-400 mt-2">Aumento promedio en leads capturados</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-cyan-400">24/7</div>
                <p className="text-slate-400 mt-2">Tu bot trabaja sin descanso</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-green-400">5min</div>
                <p className="text-slate-400 mt-2">Tiempo total de configuración</p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== SOCIAL PROOF ==================== */}
        <section className="py-20 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black text-white mb-12 text-center">
              Confían en nosotros
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, idx) => (
                <div key={idx} className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{testimonial.avatar}</div>
                    <div>
                      <p className="font-bold text-white">{testimonial.name}</p>
                      <p className="text-sm text-slate-400">{testimonial.company}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-slate-300 italic">"{testimonial.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== PRICING SECTION ==================== */}
        <section id="pricing" className="py-20 border-t border-slate-800 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 text-center">
              Planes Simples. Resultados Reales.
            </h2>
            <p className="text-lg text-slate-400 text-center max-w-2xl mx-auto mb-16">
              Elige el plan que mejor se ajuste a tu crecimiento. Actualiza o cambia cuando quieras.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Plan Starter */}
              <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/50 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                  <p className="text-slate-400">Para probar y empezar</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-white">Gratis</p>
                  <p className="text-sm text-slate-400">Para siempre</p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-3">
                    <span className="text-green-400">✓</span>
                    <span>1 bot activo</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-green-400">✓</span>
                    <span>100 leads/mes</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-green-400">✓</span>
                    <span>Respuestas básicas con IA</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-slate-600">✕</span>
                    <span className="text-slate-500">Analítica avanzada</span>
                  </li>
                </ul>
                <button
                  onClick={login}
                  disabled={loading}
                  className="w-full py-3 rounded-lg border border-slate-700 text-white font-bold hover:bg-slate-800 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Conectando...' : 'Comenzar Gratis'}
                </button>
              </div>

              {/* Plan Pro */}
              <div className="p-8 rounded-xl border-2 border-blue-500 bg-gradient-to-br from-slate-900 to-slate-950 space-y-6 ring-2 ring-blue-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-xs font-bold rounded-bl-lg">
                  MÁS POPULAR
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                  <p className="text-blue-400 font-semibold">Para crecer sin límites</p>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-black text-white">$99</p>
                  <p className="text-sm text-slate-400">por mes (14 días gratis)</p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-3">
                    <span className="text-blue-400 font-bold">✓</span>
                    <span className="text-white">Bots y leads ilimitados</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-blue-400 font-bold">✓</span>
                    <span className="text-white">IA avanzada y personalizada</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-blue-400 font-bold">✓</span>
                    <span className="text-white">Analítica en tiempo real</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-blue-400 font-bold">✓</span>
                    <span className="text-white">Soporte prioritario 24/7</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-blue-400 font-bold">✓</span>
                    <span className="text-white">Integración con CRM</span>
                  </li>
                </ul>
                <button
                  onClick={handlePurchase}
                  className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-colors transform hover:scale-105 active:scale-95"
                >
                  Prueba 14 días Gratis →
                </button>
                <p className="text-center text-xs text-slate-400">Sin tarjeta requerida. Cancela cuando quieras.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== FAQ SECTION ==================== */}
        <section id="faq" className="py-20 border-t border-slate-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-12 text-center">
              Preguntas Frecuentes
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-slate-800 rounded-lg bg-slate-900/30 overflow-hidden hover:border-slate-700 transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-white hover:bg-slate-800/30 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-xl text-blue-400">
                      {openFaq === idx ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-4 text-slate-300 bg-slate-950/50 border-t border-slate-800">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== FINAL CTA SECTION ==================== */}
        <section className="py-20 border-t border-slate-800 bg-gradient-to-b from-slate-950/50 to-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                ¿Listo para 10x tu negocio?
              </h2>
              <p className="text-lg text-slate-400">
                14 días gratis. Sin tarjeta. Sin compromiso. Empieza ahora.
              </p>
            </div>

            <button
              onClick={handlePurchase}
              className="group relative inline-flex items-center px-10 py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <span className="flex items-center space-x-2">
                <span>Comienza tu Prueba Gratuita</span>
                <span className="text-xl">→</span>
              </span>
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>

            <p className="text-sm text-slate-500">
              Al hacer clic, aceptas nuestros <span className="text-blue-400 cursor-pointer hover:underline">Términos de Servicio</span> y <span className="text-blue-400 cursor-pointer hover:underline">Política de Privacidad</span>
            </p>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="border-t border-slate-800 bg-slate-950 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <img src={logo} alt="BotInteligente" className="h-6 w-auto" />
                  <span className="font-bold text-white">BotInteligente</span>
                </div>
                <p className="text-sm text-slate-400">La plataforma #1 en automatización de WhatsApp con IA</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-4">Producto</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#features" className="hover:text-blue-400 transition-colors">Características</a></li>
                  <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Planes</a></li>
                  <li><a href="#faq" className="hover:text-blue-400 transition-colors">FAQ</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Términos</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Privacidad</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">GDPR</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-4">Contacto</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="mailto:support@botinteligente.com" className="hover:text-blue-400 transition-colors">support@botinteligente.com</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Twitter/X</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">LinkedIn</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500">
              <p>&copy; {new Date().getFullYear()} BotInteligente. Todos los derechos reservados.</p>
              <p>Hecho con ❤️ en México</p>
            </div>
          </div>
        </footer>

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-4 right-4 max-w-sm bg-red-900/90 border border-red-500/50 rounded-lg p-4 text-red-50 shadow-lg z-50 animate-in slide-in-from-bottom-4">
            <p className="font-bold mb-1">Error al conectar</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Login;