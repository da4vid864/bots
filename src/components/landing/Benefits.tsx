import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, TrendingUp, Shield } from 'lucide-react';

const benefits = [
  {
    title: 'Atención 24/7',
    description: 'Tu negocio nunca duerme. Responde a tus clientes al instante, incluso fuera del horario laboral.',
    icon: Clock,
  },
  {
    title: 'Aumenta tus Ventas',
    description: 'Captura leads calificados y cierra ventas automáticamente mientras te enfocas en crecer.',
    icon: TrendingUp,
  },
  {
    title: 'Seguridad Total',
    description: 'Tus datos y los de tus clientes están protegidos con los más altos estándares de seguridad.',
    icon: Shield,
  },
  {
    title: 'Fácil de Usar',
    description: 'No necesitas conocimientos técnicos. Nuestra plataforma es intuitiva y fácil de configurar.',
    icon: CheckCircle,
  },
];

const Benefits = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-900 to-primary-800 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Por qué elegir BotInteligente?
          </h2>
          <p className="text-primary-100 max-w-2xl mx-auto text-lg">
            Potencia tu comunicación y lleva tu negocio al siguiente nivel con nuestras herramientas avanzadas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl hover:bg-white/20 transition-all duration-300 hover:shadow-xl border border-white/10"
            >
              <div className="bg-primary-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-primary-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-primary-100 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;