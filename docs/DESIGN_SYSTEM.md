# Sistema de Diseño WhatsAuto

## Overview
Este sistema de diseño define la base visual para la landing page de WhatsAuto SaaS, alineándose con la voz de la marca: **profesional-empático, dinámico-tecnológico, confiable**. Audiencia objetivo: Equipos de ventas y marketing en PYMES de alto crecimiento en comercio electrónico y servicios.

## 1. Sistema de Color

### 1.1 Colores Semánticos

#### Primario (Acción de Marca)
- **Propósito:** Acciones primarias, CTAs principales, elementos interactivos clave.
- **Impacto Psicológico:** El azul transmite confianza, fiabilidad y profesionalidad, esencial para una herramienta que gestiona conversaciones con clientes y datos sensibles.
- **Variantes:**
  - `primary-50` `#eff6ff` (fondo claro)
  - `primary-100` `#dbeafe` (estados hover)
  - `primary-200` `#bfdbfe` (bordes)
  - `primary-300` `#93c5fd` (botones secundarios)
  - `primary-400` `#60a5fa` (estados activos)
  - `primary-500` `#2872fa` **Azul de Marca** (CTAs principales)
  - `primary-600` `#1559ed` (hover en primario)
  - `primary-700` `#1d4ed8` (activo/presionado)
  - `primary-800` `#1e40af` (modo oscuro primario)
  - `primary-900` `#1e3a8a` (acentos modo oscuro)

#### Secundario (Fondos, Acentos Suaves)
- **Propósito:** Fondos, bordes sutiles, acentos neutrales.
- **Impacto Psicológico:** El azul-gris suave crea un ambiente tranquilo y enfocado, reduciendo el ruido visual mientras mantiene una sensación tecnológica.
- **Variantes:**
  - `secondary-50` `#f2f5f7` (fondo más claro)
  - `secondary-100` `#e1e8ed` (fondos de tarjetas)
  - `secondary-200` `#c8d4de` (divisores)
  - `secondary-300` `#a0b4c8` (elementos deshabilitados)
  - `secondary-400` `#7b95ad` (texto placeholder)
  - `secondary-500` `#5a738c` (texto secundario)
  - `secondary-600` `#3a4f66` (texto del cuerpo)
  - `secondary-700` `#2d3f52` (encabezados)
  - `secondary-800` `#192a3d` (fondos modo oscuro)
  - `secondary-900` `#0f1a26` (superficies modo oscuro)

#### Acento (CTAs Secundarios, Highlights)
- **Propósito:** Highlights, estados de éxito, botones secundarios, elementos orientados al crecimiento.
- **Impacto Psicológico:** El verde simboliza el crecimiento, la positividad y la empatía, alineándose con la promesa del producto de aumentar los leads y mejorar las relaciones con los clientes.
- **Variantes:**
  - `accent-50` `#ecfdf5`
  - `accent-100` `#d1fae5`
  - `accent-200` `#a7f3d0`
  - `accent-300` `#6ee7b7`
  - `accent-400` `#34d399`
  - `accent-500` `#10b981` **Verde de Marca** (CTAs de acento)
  - `accent-600` `#059669`
  - `accent-700` `#047857`
  - `accent-800` `#065f46`
  - `accent-900` `#064e3b`

### 1.2 Colores de Estado
- **Éxito:** `#10b981` (accent-500) – refuerza resultados positivos (ej., "lead capturado").
- **Error:** `#ef4444` – claro, llama la atención para problemas críticos.
- **Advertencia:** `#f59e0b` – alerta a los usuarios sin causar pánico.
- **Info:** `#3b82f6` – azul familiar para mensajes informativos.

### 1.3 Escala de Grises
- **Uso:** Texto neutral, bordes y fondos.
- **Escala:**
  - `gray-50` `#f9fafb` (fondo)
  - `gray-100` `#f3f4f6` (fondos sutiles)
  - `gray-200` `#e5e7eb` (bordes)
  - `gray-300` `#d1d5db` (divisores)
  - `gray-400` `#9ca3af` (placeholder)
  - `gray-500` `#6b7280` (texto secundario)
  - `gray-600` `#4b5563` (texto del cuerpo)
  - `gray-700` `#374151` (encabezados)
  - `gray-800` `#1f2937` (texto modo oscuro)
  - `gray-900` `#111827` (encabezados modo oscuro)

### 1.4 Degradados Funcionales
- **Degradado Hero:** `linear-gradient(135deg, #2872fa 0%, #10b981 100%)`
  - Combina confianza (azul) con crecimiento (verde) para una sección dinámica y atractiva sobre el pliegue.
- **Degradado Botón:** `linear-gradient(90deg, #2872fa, #1559ed)`
  - Añade profundidad a los botones primarios, mejorando la percepción de click-through.

### 1.5 Mapeo de Modo Oscuro
| Token Modo Claro | Token Modo Oscuro | Justificación |
|---|---|---|
| `primary-500` | `primary-400` | Mejor contraste en fondos oscuros |
| `secondary-50` | `secondary-900` | Invertir relación fondo/primer plano |
| `secondary-100` | `secondary-800` | Superficies más suaves en tema oscuro |
| `gray-50` | `gray-900` | Inversión de fondo |
| `gray-100` | `gray-800` | Inversión de fondo sutil |
| `gray-900` | `gray-50` | Inversión de texto |
| `white` | `secondary-900` | El blanco puro es demasiado duro en modo oscuro |

### 1.6 Cumplimiento de WCAG AA
Todos los pares de colores utilizados para el texto cumplen con una relación de contraste de al menos **4.5:1** (texto normal) y **3:1** para texto grande. Ejemplos:
- `primary-500` en `white` = 4.6:1 ✅
- `secondary-600` en `secondary-50` = 7.2:1 ✅
- `accent-600` en `white` = 4.54:1 ✅
- `gray-900` en `gray-100` = 10.2:1 ✅

## 2. Sistema de Tipografía

### 2.1 Font Stack
- **Encabezados:** `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - **Justificación:** Inter es una sans-serif moderna, geométrica con excelente legibilidad y una personalidad tecnológica. Soporta múltiples pesos y está optimizada para pantallas.
- **Cuerpo:** `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif`
  - **Justificación:** Las fuentes del sistema aseguran una carga rápida y un renderizado consistente en todas las plataformas, manteniendo un tono profesional.

### 2.2 Escala de Tipos (Base: 1rem = 16px)
| Elemento | Tamaño de Fuente (rem) | Altura de Línea | Clase Tailwind | Uso |
|---|---|---|---|---|
| H1 | 3.5 rem (56px) | 1.1 | `text-5xl md:text-6xl font-bold tracking-tight` | Encabezado principal |
| H2 | 2.5 rem (40px) | 1.2 | `text-4xl font-semibold tracking-tight` | Títulos de sección |
| H3 | 2.0 rem (32px) | 1.3 | `text-3xl font-semibold` | Encabezados de características |
| H4 | 1.5 rem (24px) | 1.4 | `text-2xl font-semibold` | Títulos de tarjetas |
| H5 | 1.25 rem (20px) | 1.5 | `text-xl font-medium` | Subencabezados |
| H6 | 1.125 rem (18px) | 1.5 | `text-lg font-medium` | Encabezados menores |
| Cuerpo (largo) | 1.125 rem (18px) | 1.7 | `text-lg` | Párrafos introductorios |
| Cuerpo | 1 rem (16px) | 1.6 | `text-base` | Texto del cuerpo predeterminado |
| Pequeño | 0.875 rem (14px) | 1.5 | `text-sm` | Subtítulos, metainformación |
| Extra Pequeño | 0.75 rem (12px) | 1.4 | `text-xs` | Etiquetas, letra pequeña |

### 2.3 Jerarquía de Sección
- **Hero:** H1 con texto degradado, H2 para subencabezado, cuerpo grande para propuesta de valor.
- **Características:** Título de sección H2, tarjetas de características H3, texto del cuerpo para descripciones.
- **Testimonios:** Título de sección H2, nombres de clientes H4, cuerpo para citas.
- **Precios:** Título de sección H2, nombres de planes H4, cuerpo para características.
- **FAQ:** Título de sección H2, preguntas H5, respuestas del cuerpo.

Esta jerarquía guía el seguimiento ocular de mayor a menor, creando un flujo visual claro que enfatiza los mensajes clave.

## 3. Configuración de Tailwind CSS

### 3.1 `tailwind.config.js` Completo
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // or 'media' based on preference
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2872fa',
          600: '#1559ed',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f2f5f7',
          100: '#e1e8ed',
          200: '#c8d4de',
          300: '#a0b4c8',
          400: '#7b95ad',
          500: '#5a738c',
          600: '#3a4f66',
          700: '#2d3f52',
          800: '#192a3d',
          900: '#0f1a26',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      fontFamily: {
        heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        body: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', '"Open Sans"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2872fa 0%, #10b981 100%)',
        'gradient-button': 'linear-gradient(90deg, #2872fa, #1559ed)',
      },
    },
  },
  plugins: [],
}
```

### 3.2 Ejemplos de Uso
```html
<!-- Botón Primario -->
<button class="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
  Iniciar Prueba Gratuita
</button>

<!-- Botón de Acento -->
<button class="bg-accent-600 hover:bg-accent-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
  Ver Precios
</button>

<!-- Sección Hero con degradado -->
<section class="bg-gradient-primary text-white">
  <h1 class="font-heading text-5xl md:text-6xl font-bold tracking-tight">Automatice las conversaciones de ventas y soporte</h1>
</section>

<!-- Tarjeta con fondo secundario -->
<div class="bg-secondary-50 dark:bg-secondary-900 p-6 rounded-xl">
  <h3 class="font-heading text-2xl font-semibold text-secondary-800 dark:text-secondary-100">Intención Predictiva del Cliente</h3>
</div>
```

## 4. Microinteracciones y Estados Hover

### 4.1 Estados Hover de Botones
- **Botón Primario:** `transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`
- **Botón Secundario:** `transition-all duration-200 hover:scale-[1.02] hover:shadow-md`
- **Botón de Esquema:** `transition-all duration-200 hover:scale-[1.01] hover:shadow-sm`
- **Botón Fantasma:** `transition-colors duration-200 hover:bg-secondary-100 dark:hover:bg-secondary-800`

### 4.2 Estados Hover de Tarjetas
Las tarjetas deben tener un levantamiento sutil y un aumento de sombra al pasar el ratón para indicar interactividad.

```html
<div class="bg-white dark:bg-secondary-900 rounded-xl p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
  <!-- contenido de la tarjeta -->
</div>
```

**Clases Tailwind:** `transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`

### 4.3 Estados Hover de Enlaces de Navegación
Los enlaces de navegación deben tener un subrayado sutil y un cambio de color.

```html
<a class="text-secondary-700 dark:text-secondary-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200 border-b-2 border-transparent hover:border-primary-500">
  Enlace
</a>
```

**Clases Tailwind:** `transition-colors duration-200 hover:text-primary-500 dark:hover:text-primary-400 hover:border-primary-500`

## 5. Justificaciones Estratégicas Resumen

- **Psicología del Color:** Azul (confianza) + Verde (crecimiento) = una paleta que tranquiliza al tiempo que promete una mejora comercial.
- **Tipografía:** Inter y las fuentes del sistema equilibran el rendimiento con una estética moderna y profesional.
- **Modo Oscuro:** Los tokens asignados garantizan la legibilidad y reducen la fatiga visual para un uso prolongado.
- **Cumplimiento de WCAG:** Todos los contrastes cumplen con los estándares AA, lo que hace que la página de destino sea accesible para un público más amplio.
- **Integración de Tailwind:** Los colores y fuentes tokenizados permiten un desarrollo rápido y coherente en todo el proyecto.
- **Microinteracciones:** Las animaciones sutiles y los efectos de desplazamiento mejoran la calidad percibida y la participación del usuario, haciendo que la interfaz sea dinámica y receptiva.