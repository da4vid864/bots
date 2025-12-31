# 📊 Guía de Exportación de Datos CSV

## Descripción General

Se ha agregado un sistema completo de exportación de datos de clientes y chats analizados en formato CSV. Esto permite descargar información del Sales Panel en múltiples formatos según necesidad.

## Funciones de Exportación

### 1. **Exportar Todos los Chats Analizados**
**Endpoint:** `GET /api/analyzed-chats/export/all`

Descarga CSV con todos los clientes/chats analizados incluyendo:
- ID, Teléfono, Nombre Contacto
- Categoría del Pipeline
- Puntuaciones: Lead, Engagement, Confianza, Urgencia, Interés Producto, Sentimiento
- Usuario asignado
- Último mensaje y total de mensajes
- Fechas de creación y actualización

**Ejemplo de uso en frontend:**
```javascript
const downloadAllChats = async () => {
  const response = await fetch('/api/analyzed-chats/export/all');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chats-analizados.csv';
  a.click();
};
```

### 2. **Exportar por Categoría**
**Endpoint:** `GET /api/analyzed-chats/export/category/:category`

Descarga CSV solo con chats de una categoría específica del pipeline.

**Ejemplo:**
```
GET /api/analyzed-chats/export/category/Interesado
GET /api/analyzed-chats/export/category/En%20Negociación
```

### 3. **Exportar Leads de Alto Valor**
**Endpoint:** `GET /api/analyzed-chats/export/high-value?minScore=70`

Descarga CSV con leads que superan una puntuación mínima.

**Query Parameters:**
- `minScore` (opcional, default: 70) - Puntuación mínima del lead

**Ejemplo:**
```
GET /api/analyzed-chats/export/high-value?minScore=75
```

### 4. **Exportar por Usuario Asignado**
**Endpoint:** `GET /api/analyzed-chats/export/assigned/:assignedTo`

Descarga CSV con chats asignados a un vendedor específico.

**Ejemplo:**
```
GET /api/analyzed-chats/export/assigned/juan@company.com
```

### 5. **Exportar Estadísticas**
**Endpoint:** `GET /api/analyzed-chats/export/statistics`

Descarga CSV con estadísticas agregadas del pipeline:
- Mes/Año
- Total de chats
- Puntuación promedio
- Comprometidos, Interesados
- Mensajes analizados
- Leads asignados

## Estructura de Servicios

### exportService.js

```javascript
// Importar en tus servicios o rutas
const exportService = require('../services/exportService');

// Funciones disponibles:
- convertToCSV(data, columns) // Convierte array a CSV
- exportAnalyzedChatsToCSV(tenantId) // Todos los chats
- exportChatsByCategoryToCSV(tenantId, category) // Por categoría
- exportHighValueLeadsToCSV(tenantId, minScore) // Leads valiosos
- exportStatisticsToCSV(tenantId) // Estadísticas
- exportAssignedChatsToCSV(tenantId, assignedTo) // Por asignado
- saveCSVFile(csv, filename, outputDir) // Guardar en disco
```

## Formatos de Salida

### Estructura CSV

Todos los archivos CSV incluyen:
- **Encabezados:** Primera fila con nombres de columnas
- **Codificación:** UTF-8 (soporta caracteres especiales)
- **Separador:** Comas
- **Entrecomillado:** Valores con comas o comillas están entrecomillados
- **Fechas:** Formato localizado (es-MX por defecto)

### Nombres de Archivo

Los archivos descargados siguen el patrón:
```
[tipo]-[fecha-hora].csv

Ejemplos:
- chats-analizados-2025-12-30T14-30-45.csv
- chats-Interesado-2025-12-30T14-30-45.csv
- leads-alto-valor-2025-12-30T14-30-45.csv
- clientes-juan@company-2025-12-30T14-30-45.csv
- estadisticas-2025-12-30T14-30-45.csv
```

## Integración en Frontend

### Botón de Descarga Simple

```jsx
import React from 'react';

function ExportButton() {
  const handleExport = async (endpoint, filename) => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Error en descarga');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando:', error);
      alert('Error al descargar archivo');
    }
  };

  return (
    <div>
      <button onClick={() => handleExport('/api/analyzed-chats/export/all', 'chats.csv')}>
        📥 Descargar Todos
      </button>
      <button onClick={() => handleExport('/api/analyzed-chats/export/high-value', 'leads.csv')}>
        ⭐ Descargar Leads Alto Valor
      </button>
    </div>
  );
}

export default ExportButton;
```

### Componente Avanzado con Opciones

```jsx
function AdvancedExportPanel() {
  const [exportType, setExportType] = React.useState('all');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [minScore, setMinScore] = React.useState(70);

  const handleExport = async () => {
    let endpoint = '/api/analyzed-chats/export/all';

    switch (exportType) {
      case 'category':
        endpoint = `/api/analyzed-chats/export/category/${encodeURIComponent(selectedCategory)}`;
        break;
      case 'high-value':
        endpoint = `/api/analyzed-chats/export/high-value?minScore=${minScore}`;
        break;
      case 'statistics':
        endpoint = '/api/analyzed-chats/export/statistics';
        break;
    }

    const response = await fetch(endpoint);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="export-panel">
      <select value={exportType} onChange={(e) => setExportType(e.target.value)}>
        <option value="all">Todos los Chats</option>
        <option value="category">Por Categoría</option>
        <option value="high-value">Leads Alto Valor</option>
        <option value="statistics">Estadísticas</option>
      </select>

      {exportType === 'category' && (
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">Selecciona categoría...</option>
          <option value="Nuevo">Nuevo</option>
          <option value="Interesado">Interesado</option>
          <option value="En Negociación">En Negociación</option>
          <option value="Ganado">Ganado</option>
        </select>
      )}

      {exportType === 'high-value' && (
        <input
          type="number"
          value={minScore}
          onChange={(e) => setMinScore(parseInt(e.target.value))}
          placeholder="Puntuación mínima"
        />
      )}

      <button onClick={handleExport}>📥 Descargar</button>
    </div>
  );
}
```

## Características Técnicas

### Ventajas

✅ **Multi-tenant:** Cada usuario solo descarga sus propios datos
✅ **Filtrado flexible:** Múltiples criterios de filtrado
✅ **Rendimiento:** Consultas optimizadas con índices de BD
✅ **Seguridad:** Requiere autenticación (requireAuth)
✅ **Unicode:** Soporte completo para caracteres especiales
✅ **Timestamps:** Fechas formateadas localizadas
✅ **Escaping:** Manejo correcto de caracteres especiales en CSV

### Base de Datos

Las exportaciones consultan directamente desde las tablas:
- `analyzed_chats` - Datos principales de chats
- `chat_analysis_details` - Detalles de análisis
- `pipeline_statistics` - Estadísticas agregadas

### Límites y Consideraciones

- **Tiempo máximo:** Sin límite (streaming directo)
- **Tamaño máximo:** Limitado por memoria disponible
- **Frecuencia:** Sin throttling (implementar si es necesario)
- **Caché:** Sin caché (datos siempre actuales)

## Casos de Uso

### 1. Reporte Semanal de Ventas
```javascript
// Descargar leads de alto valor para presentación
GET /api/analyzed-chats/export/high-value?minScore=80
```

### 2. Asignación de Tareas
```javascript
// Cada vendedor descarga sus chats asignados
GET /api/analyzed-chats/export/assigned/vendedor@company.com
```

### 3. Análisis de Categoría
```javascript
// Revisar todos los "En Negociación"
GET /api/analyzed-chats/export/category/En%20Negociación
```

### 4. Backup de Datos
```javascript
// Backup diario de todos los chats
GET /api/analyzed-chats/export/all
```

### 5. Integración CRM
```javascript
// Importar leads en software externo
GET /api/analyzed-chats/export/high-value?minScore=75
// Abrir en Excel → Guardar como XLS → Importar en CRM
```

## Solución de Problemas

### Problema: Descarga vacía
**Causa:** Sin datos en la categoría/filtro seleccionado
**Solución:** Verificar que existan chats analizados

### Problema: Caracteres extraños en Excel
**Causa:** Codificación diferente
**Solución:** Al abrir en Excel: Datos → De Texto → UTF-8

### Problema: Números sin decimales
**Causa:** Excel interpreta como números
**Solución:** Formatear como "Texto" antes de abrir

## Futuras Mejoras

- [ ] Exportación en formato XLSX (Excel nativo)
- [ ] Exportación en formato JSON
- [ ] Exportación en formato PDF
- [ ] Programación de exportaciones automáticas
- [ ] Envío automático por email
- [ ] Exportación incremental (cambios desde última descarga)
- [ ] Compresión ZIP de múltiples archivos
- [ ] Integración con Google Sheets

## Versión

- **Creado:** 30 de Diciembre de 2025
- **Servicio:** exportService.js (700+ líneas)
- **Endpoints:** 5 nuevas rutas
- **Base de datos:** Sin nuevas tablas requeridas
