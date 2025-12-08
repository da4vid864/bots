import React from 'react';
import { FiSmartphone, FiSettings, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Step = ({ icon: Icon, number, title, description, delay }: { icon: any, number: string, title: string, description: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="relative flex flex-col items-center text-center max-w-sm mx-auto"
  >
    <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 relative z-10">
      <Icon size={40} className="text-blue-600" />
      <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold border-4 border-white">
        {number}
      </div>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

export const HowItWorks = () => {
  const steps = [
    {
      icon: FiSmartphone,
      number: "1",
      title: "Conecta tu WhatsApp",
      description: "Escanea el código QR desde tu WhatsApp Business. Es tan fácil como iniciar sesión en WhatsApp Web."
    },
    {
      icon: FiSettings,
      number: "2",
      title: "Configura tu Bot",
      description: "Define tus reglas de respuesta, carga tu catálogo de productos o entrena a la IA con tu información."
    },
    {
      icon: FiZap,
      number: "3",
      title: "Automatiza y Vende",
      description: "Tu bot comenzará a responder, calificar leads y cerrar ventas automáticamente 24/7."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Automatización simple en <span className="text-blue-600">3 pasos</span>
          </h2>
          <p className="text-lg text-gray-600">
            No necesitas ser programador. Nuestra plataforma está diseñada para que empieces en minutos.
          </p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-12">
          {/* Connecting Line (Desktop only) */}
          <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-0.5 bg-blue-100 -z-0"></div>

          {steps.map((step, index) => (
            <Step 
              key={index}
              icon={step.icon}
              number={step.number}
              title={step.title}
              description={step.description}
              delay={index * 0.2}
            />
          ))}
        </div>
      </div>
    </section>
  );
};