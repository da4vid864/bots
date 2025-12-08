import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: '¿Necesito conocimientos técnicos para usar BotInteligente?',
    answer: 'No, nuestra plataforma está diseñada para ser intuitiva y fácil de usar. Puedes configurar tu bot en minutos sin escribir una sola línea de código.',
  },
  {
    question: '¿Puedo integrar el bot con mi CRM actual?',
    answer: 'Sí, ofrecemos integraciones con los CRMs más populares y una API flexible para conectar con cualquier sistema que utilices.',
  },
  {
    question: '¿Qué sucede si excedo el límite de conversaciones?',
    answer: 'Te notificaremos antes de que alcances el límite. Puedes actualizar tu plan en cualquier momento o pagar un pequeño costo adicional por conversación extra.',
  },
  {
    question: '¿Es seguro usar BotInteligente con WhatsApp?',
    answer: 'Absolutamente. Utilizamos la API oficial de WhatsApp Business y cumplimos con todos los estándares de seguridad y privacidad de datos.',
  },
  {
    question: '¿Ofrecen soporte técnico?',
    answer: 'Sí, todos nuestros planes incluyen soporte por correo electrónico. Los planes superiores cuentan con soporte prioritario y asistencia personalizada.',
  },
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Resolvemos tus dudas para que puedas tomar la mejor decisión para tu negocio.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden hover:border-primary-200 transition-colors duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors duration-300 text-left focus:outline-none"
              >
                <span className="font-semibold text-gray-900 text-lg">
                  {faq.question}
                </span>
                {activeIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-primary-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-100">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;