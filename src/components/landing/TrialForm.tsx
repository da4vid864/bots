import React from 'react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { SubmitButton } from '../ui/SubmitButton';
import { User, Mail, Phone, Building2 } from 'lucide-react';

interface TrialFormData {
  name: string;
  email: string;
  phone: string;
  businessName: string;
}

const TrialForm = () => {
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting,
    isSuccess,
  } = useFormValidation<TrialFormData>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      businessName: '',
    },
    validations: {
      name: { required: true, minLength: 2 },
      email: { required: true, email: true },
      phone: { required: true, pattern: /^[0-9+\-\s()]*$/ },
      businessName: { required: true },
    },
    onSubmit: async (values) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Form submitted:', values);
    },
  });

  return (
    <section id="registro" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Prueba BotInteligente <span className="text-primary-600">7 días GRATIS</span>
            </h2>
            <p className="text-gray-600">
              Sin compromiso. No se requiere tarjeta de crédito.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.name ? 'border-error' : 'border-gray-300'
                  } rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="Tu nombre"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-error">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.email ? 'border-error' : 'border-gray-300'
                  } rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-error">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={values.phone}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.phone ? 'border-error' : 'border-gray-300'
                  } rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="+52 55 1234 5678"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-error">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Negocio
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={values.businessName}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.businessName ? 'border-error' : 'border-gray-300'
                  } rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="Tu Empresa"
                />
              </div>
              {errors.businessName && (
                <p className="mt-1 text-sm text-error">{errors.businessName}</p>
              )}
            </div>

            <div className="pt-4">
              <SubmitButton
                loading={isSubmitting}
                success={isSuccess}
                idleText="Comenzar Prueba Gratis"
                loadingText="Procesando..."
                successText="¡Registro Exitoso!"
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              />
            </div>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              Al registrarte, aceptas nuestros términos y condiciones y política de privacidad.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default TrialForm;