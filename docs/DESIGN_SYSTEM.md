# Design System - BotInteligente

## 📋 Visión General

Este documento define el sistema de diseño unificado para BotInteligente, asegurando consistencia visual y de experiencia en toda la aplicación.

**Última actualización**: 2024
**Versión**: 1.0

---

## 🎨 Paleta de Colores

### Tema Oscuro (Principal)

#### Colores Base
```css
/* Backgrounds */
--bg-primary: #0f172a;      /* slate-950 */
--bg-secondary: #1e293b;    /* slate-800 */
--bg-tertiary: #334155;     /* slate-700 */
--bg-surface: rgba(15, 23, 42, 0.5); /* slate-900/50 */

/* Texto */
--text-primary: #f1f5f9;    /* slate-100 */
--text-secondary: #94a3b8;  /* slate-400 */
--text-tertiary: #64748b;  /* slate-500 */

/* Bordes */
--border-primary: #1e293b;  /* slate-800 */
--border-secondary: #334155; /* slate-700 */
```

#### Colores de Acento
```css
/* Primary (Azul) */
--blue-500: #3b82f6;
--blue-600: #2563eb;
--blue-700: #1d4ed8;

/* Success (Verde) */
--green-500: #22c55e;
--green-600: #16a34a;

/* Warning (Amarillo) */
--yellow-500: #eab308;
--yellow-600: #ca8a04;

/* Error (Rojo) */
--red-500: #ef4444;
--red-600: #dc2626;
```

### Uso de Colores

| Contexto | Color | Uso |
|----------|-------|-----|
| Acciones principales | `blue-600` | Botones primarios, enlaces |
| Éxito | `green-500` | Confirmaciones, estados positivos |
| Advertencia | `yellow-500` | Alertas, estados de atención |
| Error | `red-500` | Errores, acciones destructivas |
| Información | `blue-500` | Notificaciones informativas |

---

## 📝 Tipografía

### Fuentes
- **Familia**: `system-ui, -apple-system, sans-serif`
- **Monospace**: `'Courier New', monospace` (solo para código)

### Escala Tipográfica

| Elemento | Tamaño | Peso | Uso |
|----------|--------|------|-----|
| H1 | `2.25rem` (36px) | `900` (black) | Títulos principales |
| H2 | `1.875rem` (30px) | `800` (extrabold) | Títulos de sección |
| H3 | `1.5rem` (24px) | `700` (bold) | Subtítulos |
| H4 | `1.25rem` (20px) | `600` (semibold) | Títulos de tarjeta |
| Body | `1rem` (16px) | `400` (normal) | Texto principal |
| Small | `0.875rem` (14px) | `400` (normal) | Texto secundario |
| XS | `0.75rem` (12px) | `400` (normal) | Metadatos, labels |

### Line Height
- **Headings**: `1.2`
- **Body**: `1.5`
- **Small**: `1.4`

---

## 📐 Espaciado

### Sistema de Espaciado (Base: 4px)

| Nombre | Valor | Uso |
|--------|-------|-----|
| xs | `0.25rem` (4px) | Espaciado mínimo |
| sm | `0.5rem` (8px) | Espaciado pequeño |
| md | `1rem` (16px) | Espaciado estándar |
| lg | `1.5rem` (24px) | Espaciado grande |
| xl | `2rem` (32px) | Espaciado extra grande |
| 2xl | `3rem` (48px) | Espaciado sección |

### Padding de Componentes

| Componente | Padding |
|-----------|---------|
| Botones (sm) | `0.375rem 0.75rem` |
| Botones (md) | `0.5rem 1rem` |
| Botones (lg) | `0.75rem 1.5rem` |
| Cards | `1.5rem` (24px) |
| Inputs | `0.5rem 0.75rem` |
| Modales | `1.5rem` |

---

## 🧩 Componentes

### Button

**Variantes**:
- `primary`: Acción principal (gradiente azul)
- `secondary`: Acción secundaria (slate-800)
- `danger`: Acción destructiva (gradiente rojo)
- `ghost`: Acción sutil (transparente)
- `success`: Acción de éxito (gradiente verde)

**Tamaños**:
- `sm`: `px-3 py-1.5 text-sm`
- `md`: `px-4 py-2 text-base` (default)
- `lg`: `px-6 py-3 text-lg`

**Estados**:
- Default: Color base
- Hover: Color más oscuro + escala 1.02
- Active: Escala 0.95
- Disabled: Opacidad 50% + cursor not-allowed
- Loading: Spinner + texto

**Ejemplo**:
```jsx
<Button variant="primary" size="md" loading={isLoading}>
  Guardar
</Button>
```

### Input

**Estados**:
- Default: `bg-slate-800/50 border-slate-700`
- Focus: `ring-2 ring-blue-500 border-blue-500`
- Error: `border-red-500/50 text-red-300`
- Disabled: `bg-slate-800/30 opacity-50`

**Accesibilidad**:
- `aria-invalid` en estado de error
- `aria-describedby` apunta al mensaje de error
- Label asociado con `htmlFor`

### Card

**Estructura**:
- Header (opcional): Título y subtítulo
- Body: Contenido principal
- Footer (opcional): Acciones o información adicional

**Estilos**:
- Background: `bg-gradient-to-br from-slate-900/50 to-slate-950/50`
- Border: `border border-slate-800`
- Hover: `hover:border-slate-700`

### Modal

**Tamaños**:
- `sm`: `max-w-md`
- `md`: `max-w-lg` (default)
- `lg`: `max-w-2xl`
- `xl`: `max-w-4xl`
- `full`: `max-w-full mx-4`

**Características**:
- Backdrop blur
- Focus trap
- Cierre con ESC
- Cierre con click fuera (opcional)

### LoadingSpinner

**Tamaños**:
- `sm`: `w-4 h-4`
- `md`: `w-8 h-8` (default)
- `lg`: `w-12 h-12`
- `xl`: `w-16 h-16`

**Modos**:
- Inline: Spinner simple
- FullScreen: Overlay completo con mensaje

### Toast

**Tipos**:
- `success`: Verde
- `error`: Rojo
- `warning`: Amarillo
- `info`: Azul

**Duración**:
- Default: 5000ms
- Error: 7000ms (más tiempo para leer)

---

## 🎯 Accesibilidad

### Principios

1. **Contraste**: Mínimo 4.5:1 para texto normal, 3:1 para texto grande
2. **Navegación por teclado**: Todos los componentes interactivos son accesibles
3. **ARIA**: Atributos apropiados en todos los componentes
4. **Focus visible**: Indicadores claros de foco

### Atributos ARIA Comunes

```jsx
// Botones
<button aria-label="Descripción de la acción">

// Formularios
<input aria-invalid={hasError} aria-describedby="error-id">

// Modales
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">

// Estados de carga
<div role="status" aria-label="Cargando...">

// Alertas
<div role="alert" aria-live="assertive">
```

### Navegación por Teclado

| Acción | Tecla |
|--------|-------|
| Navegar hacia abajo | `ArrowDown` |
| Navegar hacia arriba | `ArrowUp` |
| Navegar hacia la derecha | `ArrowRight` |
| Navegar hacia la izquierda | `ArrowLeft` |
| Seleccionar | `Enter` o `Space` |
| Cerrar modal | `Escape` |
| Abrir detalles | `Ctrl/Cmd + D` |

---

## 🎭 Animaciones

### Transiciones

**Duración estándar**: `200ms`

**Easing**:
- Default: `ease-in-out`
- Hover: `ease-out`
- Active: `ease-in`

### Micro-interacciones

1. **Hover**: Escala 1.02, cambio de color
2. **Active**: Escala 0.95
3. **Loading**: Spinner rotativo
4. **Toast**: Slide in desde la derecha

### Animaciones Prohibidas

- ❌ Animaciones que causan movimiento excesivo
- ❌ Parpadeos rápidos (pueden causar convulsiones)
- ❌ Animaciones que bloquean la interacción

---

## 📱 Responsive Design

### Breakpoints

| Nombre | Tamaño | Uso |
|--------|--------|-----|
| sm | `640px` | Móvil grande |
| md | `768px` | Tablet |
| lg | `1024px` | Desktop |
| xl | `1280px` | Desktop grande |
| 2xl | `1536px` | Pantalla extra grande |

### Estrategia Mobile-First

Todos los estilos se escriben primero para móvil y luego se ajustan con breakpoints:

```css
/* Móvil (default) */
.component {
  padding: 1rem;
}

/* Desktop */
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
  }
}
```

---

## 🚫 Anti-Patrones

### ❌ No Hacer

1. **Mezclar temas**: No usar tema claro y oscuro en el mismo componente
2. **Colores hardcodeados**: Usar siempre las variables del sistema
3. **Espaciado inconsistente**: No usar valores arbitrarios
4. **Sin estados de carga**: Siempre mostrar feedback durante operaciones
5. **Sin manejo de errores**: Todos los errores deben tener UI apropiada
6. **Ignorar accesibilidad**: Todos los componentes deben ser accesibles

### ✅ Mejores Prácticas

1. **Reutilizar componentes**: Usar componentes del sistema antes de crear nuevos
2. **Documentar variantes**: Si un componente tiene variantes, documentarlas
3. **Probar accesibilidad**: Verificar con herramientas (Lighthouse, axe)
4. **Mantener consistencia**: Seguir este sistema de diseño estrictamente

---

## 🔧 Implementación Técnica

### Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Usar colores del sistema
      },
      spacing: {
        // Sistema de 4px
      }
    }
  }
}
```

### Componentes Base

Todos los componentes base están en:
- `client/src/components/atoms/` - Componentes atómicos
- `client/src/components/ui/` - Componentes de UI reutilizables

---

## 📚 Recursos

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Patterns](https://www.w3.org/WAI/ARIA/apg/)

---

**Mantenedor**: Equipo de Desarrollo BotInteligente
**Revisión**: Trimestral
