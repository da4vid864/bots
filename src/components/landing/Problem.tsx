import React from 'react';
import { FiClock, FiMessageSquare, FiUsers, FiTrendingDown } from 'react-icons/fi';
import { motion } from 'framer-motion';

const PainPoint = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
  >
    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-6 text-red-500">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

export const Problem = () => {
  const painPoints = [
    {
      icon: FiClock,
      title: "Pérdida de Tiempo",
      description: "Pasas horas respondiendo las mismas preguntas una y otra vez, en lugar de enfocarte en hacer crecer tu negocio."
    },
    {
      icon: FiMessageSquare,
      title: "Respuestas Lentas",
      description: "Los clientes esperan respuestas inmediatas. Cada minuto de espera aumenta la probabilidad de que se vayan con la competencia."
    },
    {
      icon: FiUsers,
      title: "Leads Descalificados",
      description: "Tu equipo de ventas pierde tiempo hablando con prospectos que no tienen presupuesto o interés real de compra."
    },
    {
      icon: FiTrendingDown,
      title: "Oportunidades Perdidas",
      description: "Sin un seguimiento automático, el 80% de los clientes potenciales se enfrían y nunca llegan a comprar."
    }
  ];

  return (
    <section id="problem" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Te sientes abrumado por el <span className="text-red-500">caos en WhatsApp</span>?
          </h2>
          <p className="text-lg text-gray-600">
            Gestionar cientos de mensajes manualmente no es escalable. Estos son los problemas que frenan tu crecimiento.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {painPoints.map((point, index) => (
            <PainPoint 
              key={index}
              icon={point.icon}
              title={point.title}
              description={point.description}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};