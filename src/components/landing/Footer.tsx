import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-4">BotInteligente</h3>
            <p className="text-sm leading-relaxed mb-4">
              Automatiza tu comunicación y haz crecer tu negocio con la plataforma líder de chatbots para WhatsApp.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Inicio</a></li>
              <li><a href="#features" className="hover:text-primary-400 transition-colors">Características</a></li>
              <li><a href="#pricing" className="hover:text-primary-400 transition-colors">Precios</a></li>
              <li><a href="#faq" className="hover:text-primary-400 transition-colors">Preguntas Frecuentes</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Términos de Servicio</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Política de Cookies</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 text-primary-400" />
                <span>contacto@botinteligente.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 text-primary-400" />
                <span>+52 55 1234 5678</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 text-primary-400" />
                <span>Ciudad de México, México</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} BotInteligente. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;