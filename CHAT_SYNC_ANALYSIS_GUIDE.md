# 📊 Sistema de Sincronización y Análisis Automático de Chats

## Descripción General

Cuando un bot WhatsApp se conecta en Baileys, el sistema **automáticamente**:
1. ✅ Obtiene TODOS los chats históricos
2. ✅ Analiza cada conversación con IA (DeepSeek)
3. ✅ Guarda análisis en BD (`analyzed_chats` table)
4. ✅ Calcula score de calificación
5. ✅ Clasifica en categoría de pipeline
6. ✅ Muestra todo en SalesPanelEnhanced

**Resultado**: El usuario ve el panel de ventas lleno de datos INMEDIATAMENTE, sin esperar a nuevos mensajes.

---

## 🔄 Flujo Técnico Completo

### 1. **Bot se conecta a WhatsApp**
```
Baileys: connection.update → 'open'
```

### 2. **baileysManager.js detecta conexión**
```javascript
if (connection === 'open') {
    // ... [Guardar credenciales] ...
    setTimeout(async () => {
        await forceHistorySync(botId);  // 3s después
        setTimeout(async () => {
            await syncAndAnalyzeAllChats(botId, socket, tenantId);  // 5s después
        }, 2000);
    }, 3000);
}
```

### 3. **syncAndAnalyzeAllChats() en baileysManager.js**

Nueva función que:
- Obtiene `socket.store.chats.all()`
- Filtra solo chats individuales (@c.us, @s.whatsapp.net)
- Para cada chat:
  - Extrae últimos 100 mensajes
  - Obtiene contenido de texto
  - Envía a `chatAnalysisService.analyzeChatConversation()`

```javascript
async function syncAndAnalyzeAllChats(botId, socket, tenantId) {
    const allChats = socket.store.chats.all();  // Todos los chats
    
    for (const chat of allChats) {
        const messages = await getMessagesFromChat(socket, chat.id);
        
        // Analizar cada chat
        await chatAnalysisService.analyzeChatConversation({
            botId,
            contactPhone,
            contactName,
            messages: formattedMessages
        }, tenantId);
    }
}
```

### 4. **chatAnalysisService.analyzeChatConversation()**

Para cada chat:
1. Llama a DeepSeek API con los mensajes
2. Recibe análisis: intención, confianza, urgencia, sentimiento
3. Calcula lead_score (0-100)
4. Clasifica en categoría de pipeline
5. **Guarda en BD** (tabla `analyzed_chats`)

```javascript
const analyzedChat = await saveAnalyzedChat({
    botId,
    contactPhone,
    contactName,
    analysisResults: analysisResult,
    leadScore: 75,
    pipelineCategory: 'calientes',
    productsMentioned: [...]
});
```

### 5. **BD: analyzed_chats table**

Tabla que almacena:
```sql
CREATE TABLE analyzed_chats (
    id UUID,
    bot_id TEXT,
    contact_phone VARCHAR(20),
    contact_name VARCHAR(255),
    lead_score INTEGER,  -- 0-100
    pipeline_category VARCHAR(50),  -- nuevos_contactos, calientes, etc
    analysis_results JSONB,  -- {intension, confianza, urgencia, ...}
    products_mentioned JSONB,
    status VARCHAR(50),  -- analyzed, classified, assigned, converted
    assigned_to INTEGER,  -- Usuario asignado
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 6. **SalesPanelEnhanced carga datos de BD**

Al cargar el panel:
```javascript
useEffect(() => {
    loadAnalyzedChats();  // GET /api/analyzed-chats
    loadCategories();     // GET /api/analyzed-chats/categories
    loadStatistics();     // GET /api/analyzed-chats/statistics
}, []);

const loadAnalyzedChats = async () => {
    const response = await fetch('/api/analyzed-chats?limit=100');
    // Respuesta = datos de BD, NO de Baileys
};
```

### 7. **Routes/analyzedChatsRoutes.js**

Endpoints que leen/escriben a BD:
- `GET /api/analyzed-chats` → Lee de `analyzed_chats` table
- `GET /api/analyzed-chats/categories` → Lee de `pipeline_categories`
- `GET /api/analyzed-chats/statistics` → Agrega datos
- `PATCH /api/analyzed-chats/:id/category` → Actualiza categoría (Drag & drop)
- `PATCH /api/analyzed-chats/:id/assign` → Asigna a vendedor

---

## 📊 Visualización en Tiempo Real

### Kanban Pipeline (por categoría)
```
[Nuevos Contactos] | [Calientes] | [En Seguimiento] | [Negociación]
├─ Chat 1          ├─ Chat 5    ├─ Chat 8         ├─ Chat 10
├─ Chat 2          ├─ Chat 6    ├─ Chat 9         └─ Chat 11
└─ Chat 3          └─ Chat 7
```

### Grid de Chats
```
Teléfono | Nombre | Score | Categoría | Última Actividad | Asignado
5551234567  Juan    85     Calientes   Hace 2h           Carlos
5559876543  María   45     Seguimiento Hace 4h           -
```

### Panel de Detalles
```
Contacto: Juan (+5551234567)
Score: 85/100 ████████░
Intención: Compra confirmada
Confianza: 95%
Urgencia: ALTA
Productos: iPhone 15, Funda
Próximos pasos: Enviar cotización
```

---

## 🔄 Actualización Continua

### Cuando llega un nuevo mensaje:
1. **handleIncomingMessage()** en baileysManager.js
2. **Analiza el nuevo mensaje** con chatAnalysisService
3. **Actualiza registro en BD** (analyzed_chats)
4. **Notifica SSE** al frontend
5. **SalesPanelEnhanced recibe evento** y recarga datos

```javascript
// En baileysManager.js
if (lead.status === 'assigned') {
    // Lead asignado a vendedor recibe nuevo mensaje
    await analyzeLeadChat(botId, lead, tenantId);
    // Actualiza analyzed_chats en BD
    sseController.sendEventToUser(email, 'CHAT_ANALYZED', {...});
}
```

---

## 📁 Archivos Modificados/Creados

| Archivo | Cambio | Función |
|---------|--------|---------|
| `baileysManager.js` | ✏️ Modificado | Agregar `syncAndAnalyzeAllChats()` |
| `syncAndAnalyzeAllChats()` | ✨ Función nueva | Sincronizar todos los chats |
| `getMessagesFromChat()` | ✨ Función nueva | Extraer mensajes del chat |
| `extractMessageContent()` | ✨ Función nueva | Procesar contenido de mensajes |
| `chatAnalysisService.js` | ✓ Existente | Analizar chats y guardar en BD |
| `analyzedChatsRoutes.js` | ✓ Existente | API para leer de BD |
| `SalesPanelEnhanced.jsx` | ✓ Ya funciona | Leer de `/api/analyzed-chats` |
| `analyzed_chats` | ✓ Tabla BD | Almacenar análisis |

---

## 🎯 Ventajas del Sistema

✅ **Análisis automático**: Sin intervención del usuario  
✅ **Histórico completo**: TODOS los chats se analizan, no solo nuevos  
✅ **Persistencia**: Datos en BD, no en memoria  
✅ **Escalable**: Puede procesar cientos de chats  
✅ **Auditoria**: Toda actividad registrada en `pipeline_movements`  
✅ **Reportable**: Datos en BD listos para analytics  
✅ **Actualización en vivo**: SSE notifica cambios  
✅ **Drag & drop**: Mover chats entre categorías  
✅ **Búsqueda y filtros**: Por nombre, teléfono, score, estado  

---

## 📈 Logs Esperados

```
[ventas-mx] ✅ WhatsApp conectado!
[ventas-mx] 🔄 Iniciando sincronización forzada...
[ventas-mx] 📚 Iniciando sincronización de TODOS los chats históricos...
[ventas-mx] 📊 Encontrados 23 chats para sincronizar
[ventas-mx] 📱 Procesando: Juan García
[ventas-mx] 🔍 Analizando 45 mensajes de 5551234567...
[ventas-mx] ✅ Chat analizado: 5551234567
[ventas-mx] 📱 Procesando: María López
...
[ventas-mx] 🎉 Sincronización completada:
[ventas-mx]    - Total chats: 23
[ventas-mx]    - Procesados: 20
[ventas-mx]    - Analizados: 20
[ventas-mx]    - Errores: 0
```

---

## ⚙️ Configuración

### Variable de Entorno Necesaria:
```
DEEPSEEK_API_KEY=sk_...
```

### En Base de Datos:
- ✅ Tabla `analyzed_chats` (creada por migración 013)
- ✅ Tabla `chat_analysis_details` (creada por migración 013)
- ✅ Tabla `pipeline_categories` (creada por migración 013)
- ✅ Tabla `pipeline_movements` (creada por migración 013)

---

## 🚀 Cómo Funciona en Práctica

### Escenario 1: Primer inicio de bot
```
Usuario: Conecta bot nuevo a WhatsApp
Sistema:
  1. Pide QR
  2. Bot escanea QR
  3. Bot conecta a WhatsApp
  4. Sincroniza TODOS los chats históricos
  5. Analiza cada uno con IA
  6. Carga todo en BD
  7. User abre SalesPanel → VE TODO LLENO ✅
```

### Escenario 2: Nuevo mensaje en chat existente
```
User: Envía mensaje a bot
Bot recibe: "Necesito el iPhone 15"
Sistema:
  1. Detecta mensaje nuevo
  2. Analiza conversación completa
  3. Actualiza analyzed_chats en BD
  4. Notifica SSE al panel
  5. Panel recarga datos
  6. User VE cambios en tiempo real ✅
```

### Escenario 3: Reinicio de servidor
```
User: Push con nuevos cambios
Servidor: Se reinicia
Sistema:
  1. Carga credenciales guardadas
  2. Reconecta a WhatsApp (SIN QR)
  3. Sincroniza nuevamente todos los chats
  4. Análisis se ejecuta de nuevo
  5. BD actualizada con nuevos datos
  6. SalesPanel listo al reiniciar ✅
```

---

## 🔍 Debugging

### Ver qué está pasando:
```bash
# En los logs del servidor busca:
grep "sincronización" server.log
grep "Analizando" server.log
grep "Chat analizado" server.log
grep "Error analizando" server.log
```

### Verificar datos en BD:
```sql
SELECT COUNT(*) FROM analyzed_chats;  -- Cuántos chats analizados
SELECT bot_id, COUNT(*) FROM analyzed_chats GROUP BY bot_id;  -- Por bot
SELECT pipeline_category, COUNT(*) FROM analyzed_chats GROUP BY pipeline_category;  -- Por categoría
```

### Si no ve datos en SalesPanel:
1. Verifica que `analyzed_chats` tenga registros
2. Verifica que `/api/analyzed-chats` devuelve datos
3. Verifica que `tenant_id` es correcto
4. Verifica logs del servidor para errores

---

**Status**: ✅ Implementado y funcionando  
**Última actualización**: 30 de diciembre de 2025
