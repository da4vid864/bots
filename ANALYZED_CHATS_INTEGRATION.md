# Integración de Análisis de Chats en Sales Panel

## 📋 Descripción General

Se ha implementado un sistema completo de captura, análisis y clasificación automática de chats de WhatsApp en el Sales Panel. Los chats se analizan automáticamente usando DeepSeek AI y se clasifican en las categorías del pipeline de ventas.

## 🎯 Flujo de Datos

```
Chat Recibido (WhatsApp)
    ↓
[Baileys Manager] - Captura mensaje
    ↓
[Lead Creation] - Crea/actualiza lead
    ↓
[Lead Qualification] - Califica cuando score >= 50 o está completo
    ↓
[Chat Analysis Service] - Ejecuta análisis AI (DeepSeek)
    ↓
[Análisis Results] - Extrae:
    - Intención (compra, consulta, soporte, reclamación)
    - Score del lead (0-100)
    - Productos mencionados
    - Sentimiento
    - Señales positivas/negativas
    ↓
[BD - analyzed_chats] - Guarda resultado
    ↓
[Frontend] - Visualiza en Kanban / Grid
```

## 📊 Tablas de Base de Datos

### 1. analyzed_chats
Tabla principal de chats analizados:
- `id`: UUID único del chat analizado
- `tenant_id`: ID del tenant (multi-tenant)
- `bot_id`: ID del bot que recibió el chat
- `contact_phone`: Teléfono del contacto
- `contact_name`, `contact_email`: Info del contacto
- `analysis_results`: JSONB con resultados del análisis AI
- `lead_score`: Score 0-100
- `pipeline_category`: Categoría actual (nuevos_contactos, calientes, etc.)
- `assigned_to`: ID del usuario asignado
- `products_mentioned`: JSONB array de productos
- `status`: pending_analysis, analyzed, classified, assigned, converted

### 2. chat_analysis_details
Detalles técnicos del análisis:
- Respuesta completa de DeepSeek
- Clasificación de intención
- Resumen de conversación
- Pasos sugeridos
- Sentimiento y engagement

### 3. pipeline_movements
Auditoría de movimientos:
- `from_category`, `to_category`: Cambios de categoría
- `moved_by`: Usuario que movió
- `moved_at`: Timestamp del movimiento

### 4. pipeline_categories
Categorías del pipeline:
- `name`: identificador único
- `display_name`: nombre mostrable
- `color_code`: color hex (#3b82f6)
- `min_score`, `max_score`: Rango de scores automáticos
- `is_final_stage`: Si es terminal (Cerrado, Cliente)

## 🔌 Endpoints API

### GET /api/analyzed-chats
Obtiene todos los chats analizados con filtros opcionales.

**Query Parameters:**
- `category`: Filtrar por categoría del pipeline
- `botId`: Filtrar por bot específico
- `minScore`: Score mínimo
- `searchTerm`: Búsqueda por nombre, teléfono, email
- `assignedTo`: Usuario asignado
- `limit`: Límite de resultados (default 50)
- `offset`: Para paginación

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "contact_name": "Juan",
      "contact_phone": "+34123456789",
      "lead_score": 75,
      "pipeline_category": "calientes",
      "analysis_results": {
        "intencion": "compra",
        "confianza": 0.85,
        "engagement": 0.9,
        "urgencia": 0.7,
        "sentimiento": 0.5,
        "proximoPaso": "Contactar para cerrar venta",
        "banderaBuena": ["Muestra interés real", "Pregunta por precio"],
        "banderaRoja": []
      },
      "products_mentioned": [
        {"name": "Producto A", "mention_count": 3, "intent": "compra"}
      ],
      "assigned_to": "uuid",
      "messages_count": 12,
      "last_message_at": "2025-12-30T20:30:00Z",
      "analyzed_at": "2025-12-30T20:35:00Z"
    }
  ],
  "pagination": { "limit": 50, "offset": 0 }
}
```

### GET /api/analyzed-chats/:id
Obtiene detalles completos de un chat analizado.

**Response:**
```json
{
  "success": true,
  "data": {
    "...": "datos del chat",
    "analysis_detail": {
      "raw_analysis": {...},
      "intent_classification": "compra",
      "conversation_summary": "...",
      "suggested_next_steps": "...",
      "sentiment_score": 0.5
    },
    "pipeline_movements": [
      {
        "from_category": "nuevos_contactos",
        "to_category": "calientes",
        "moved_by": "uuid",
        "moved_at": "2025-12-30T20:35:00Z"
      }
    ]
  }
}
```

### PATCH /api/analyzed-chats/:id/category
Cambia la categoría de un chat en el pipeline (drag & drop).

**Body:**
```json
{
  "newCategory": "calientes",
  "reason": "Mostró interés claro en el producto"
}
```

### PATCH /api/analyzed-chats/:id/assign
Asigna un chat a un vendedor.

**Body:**
```json
{
  "userId": "uuid-del-vendedor"
}
```

### GET /api/analyzed-chats/statistics
Obtiene estadísticas del pipeline.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "pipeline_category": "calientes",
      "total_chats": 45,
      "avg_score": 78,
      "converted_count": 8,
      "assigned_count": 42
    }
  ]
}
```

### POST /api/analyzed-chats/analyze
Analiza un chat manualmente (para re-análisis).

**Body:**
```json
{
  "botId": "uuid",
  "contactPhone": "+34123456789",
  "contactName": "Juan",
  "contactEmail": "juan@example.com",
  "messages": [
    {"role": "user", "content": "Hola, quiero ver el catálogo"},
    {"role": "assistant", "content": "Claro, aquí está..."},
    {"role": "user", "content": "Me interesa el producto X"}
  ],
  "botPrompt": "Eres un vendedor de..."
}
```

## 🎨 Componentes Frontend

### SalesPanelEnhanced.jsx
Página principal del Sales Panel mejorado con tres tabs:
1. **Kanban Pipeline**: Vista Kanban con drag & drop
2. **Chats Analizados**: Grid/tabla con filtros
3. **Tiempo Real**: Panel de actualizaciones en vivo

### KanbanPipeline.jsx
Kanban board visual:
- 7 columnas por categoría
- Drag & drop entre categorías
- Tarjetas con score, productos, última interacción
- Contador de chats por columna

### AnalyzedChatsGrid.jsx
Tabla de chats con:
- Búsqueda en tiempo real
- Filtros por categoría, bot, score
- Ordenamiento por cualquier columna
- Acciones rápidas (ver, asignar)
- Estadísticas en vivo

### ChatDetailsPanel.jsx
Panel lateral con:
- Información completa del contacto
- Análisis detallado (intención, confianza, urgencia)
- Señales positivas y negativas
- Productos mencionados
- Próximos pasos sugeridos
- Notas del vendedor
- Historial de movimientos

## 🚀 Integración con Baileys Manager

Cuando un lead se califica (score >= 50 o está completo):

1. `handleIncomingMessage()` en baileysManager llama a `analyzeLeadChat()`
2. `analyzeLeadChat()` obtiene todos los mensajes del lead
3. Llama a `chatAnalysisService.analyzeChatConversation()`
4. El servicio ejecuta análisis con DeepSeek
5. Guarda resultado en `analyzed_chats`
6. Notifica al frontend vía SSE: `'CHAT_ANALYZED'`

```javascript
// En baileysManager.js
await analyzeLeadChat(botId, lead, session.tenantId);
```

## 📈 Clasificación Automática

El sistema clasifica chats basado en:

1. **Lead Score** (0-100):
   - Engagement: 30%
   - Confianza: 25%
   - Urgencia: 20%
   - Interés en productos: 15%
   - Sentimiento: 10%

2. **Categorías del Pipeline**:
   - **Nuevos Contactos**: Score 0-30 (sin clasificar)
   - **Leads Calientes**: Score 70-100, interés en productos
   - **En Seguimiento**: Score 40-69, conversación activa
   - **Negociación**: Score 50-79, discutiendo términos
   - **Cerrar Venta**: Score 75-100, listos para comprar
   - **Perdidos**: Score 0-25, sin interés
   - **Clientes**: Compra completada

## 🔐 Seguridad

- **Autenticación**: Todos los endpoints requieren `requireAuth`
- **Multi-tenant**: Filtrado automático por `tenant_id`
- **Ownership**: Verificación de propiedad del bot
- **RBAC**: Soporte para roles (admin, vendor)

## 📝 Configuración Requerida

### Variables de Entorno
```env
DEEPSEEK_API_KEY=sk-...
FRONTEND_URL=http://localhost:3001
DATABASE_URL=postgresql://...
```

### Migraciones
1. Ejecutar migración 013_analyzed_chats_system.sql:
```bash
npm run migrate
# O manualmente:
psql -d your_db < migrations/013_analyzed_chats_system.sql
```

## 🧪 Testing

### Test de Análisis Manual
```bash
curl -X POST http://localhost:3000/api/analyzed-chats/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "botId": "bot-id",
    "contactPhone": "+34123456789",
    "messages": [
      {"role": "user", "content": "Hola"},
      {"role": "assistant", "content": "Hola! ¿En qué te puedo ayudar?"},
      {"role": "user", "content": "Quiero ver el catálogo de productos"}
    ]
  }'
```

## 🐛 Debugging

### Logs Importantes
- `[BotId] 📊 Analizando chat de...` - Inicio de análisis
- `[BotId] ✅ Chat analizado: Score: X - Categoría: Y` - Análisis completado
- `❌ Error analizando chat:` - Errores en análisis

### Monitoreo
- Verificar tabla `analyzed_chats`: `SELECT COUNT(*) FROM analyzed_chats;`
- Verificar movimientos: `SELECT * FROM pipeline_movements ORDER BY moved_at DESC;`
- Estadísticas: `SELECT * FROM pipeline_statistics WHERE date_period = CURRENT_DATE;`

## 📚 Referencias

- [Baileys WhatsApp API](https://github.com/WhiskeySockets/Baileys)
- [DeepSeek API](https://platform.deepseek.com)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [React Context API](https://react.dev/reference/react/useContext)

## 🔄 Próximas Mejoras

1. **WebSocket** para actualizaciones en tiempo real
2. **ML Models** para predicción de conversión
3. **Exportación** de datos (CSV, Excel)
4. **Integración** con CRM externo
5. **Analytics avanzado** con gráficos
6. **Automatización** de re-análisis periódico
7. **Notificaciones** push para nuevos leads calientes
8. **Template** de respuestas sugeridas por categoría

---

**Última actualización**: 2025-12-30
**Versión**: 1.0.0
**Estado**: ✅ Producción
