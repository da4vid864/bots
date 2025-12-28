# Lead Scoring y Arquitectura de Respuesta Automatizada

## 1. Resumen
Este documento describe la arquitectura para implementar Lead Scoring y Respuestas Automatizadas. El objetivo es asignar puntos a los leads en función de sus interacciones (palabras clave) y activar acciones automatizadas (respuestas, etiquetado) basadas en estas puntuaciones o palabras clave específicas.

## 2. Cambios en el Esquema de la Base de Datos

### 2.1. Actualizar la Tabla `leads`
Mejoraremos la tabla `leads` existente para almacenar la puntuación y las etiquetas.

```sql
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'; -- Array de strings para etiquetas como 'caliente', 'interesado', 'consulta-precio'
```

### 2.2. Nueva Tabla `scoring_rules`
Esta tabla definirá las reglas para la puntuación y la automatización por bot.

```sql
CREATE TABLE IF NOT EXISTS scoring_rules (
    id SERIAL PRIMARY KEY,
    bot_id TEXT NOT NULL,
    keyword TEXT NOT NULL,           -- La palabra o frase a buscar (ej., "precio", "demo")
    match_type TEXT DEFAULT 'contains', -- 'contains', 'exact', 'regex'
    points INTEGER DEFAULT 0,        -- Puntos a añadir (puede ser negativo)
    response_message TEXT,           -- Opcional: Respuesta de texto automatizada
    tag_to_add TEXT,                 -- Opcional: Etiqueta a aplicar (ej., "alta-intencion")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
);
```

## 3. Diseño de la Capa de Servicio

### 3.1. `services/scoringService.js` (Nuevo)
Este servicio gestionará la lógica para evaluar los mensajes con las reglas.

**Funciones Clave:**
* `getRules(botId)`: Obtiene las reglas activas para un bot (idealmente en caché, invalidar al modificar/crear/eliminar reglas).
* `evaluateMessage(botId, messageText)`:
    * Itera a través de las reglas.
    * Devuelve objeto: `{ scoreDelta: number, tags: string[], responses: string[] }`.
* `applyScoring(leadId, evaluationResult)`:
    * Actualiza la tabla `leads`: incrementa `score`, añade `tags` únicos.
    * Devuelve el lead actualizado.

### 3.2. `services/leadDbService.js` (Actualización)
* Actualizar `getOrCreateLead` para inicializar la puntuación/etiquetas si es necesario (los valores por defecto lo gestionan).
* Añadir método `updateLeadScoreAndTags(leadId, scoreDelta, newTags)`.

## 4. Lógica de Integración (`services/baileysManager.js`)

La lógica de puntuación se integrará en el pipeline `handleIncomingMessage`.

**Flujo:**
1. **Recibir Mensaje**: El usuario envía un mensaje.
2. **Obtener/Crear Lead**: Lógica existente.
3. **Puntuación y Análisis** (Nuevo Paso):
    * Llama a `scoringService.evaluateMessage(botId, message)`.
    * Si se encuentran coincidencias:
        * Llama a `scoringService.applyScoring(lead.id, result)`.
        * Si `result.responses` tiene contenido:
            * Envía estas respuestas automatizadas específicas inmediatamente.
            * *Punto de Decisión*: ¿Debería esto detener el procesamiento de la IA?
                * *Estrategia*: Si se activa una respuesta "Regla Dura" específica (ej., "DETENER"), tal vez detener. Por ahora, trataremos estas como respuestas "Inyectadas por el Sistema". La IA todavía puede generar un seguimiento si es necesario, o podemos configurar la regla para "detener_ia". Para simplificar, enviaremos la respuesta automatizada y **omitiremos** la generación de IA para este turno para evitar la doble respuesta, a menos que se configure lo contrario.
4. **Calificación de Leads**:
    * Comprueba si `lead.score` >= Umbral (ej., 50).
    * Si es sí y el estado no es 'calificado', califica automáticamente o notifica a ventas.

## 5. Historial de Chat
* **Estado Actual**: `lead_messages` (Postgres) almacena el historial. `chatHistoryService.js` (SQLite) parece no utilizarse/redundante para el flujo principal del bot.
* **Recomendación**: Continúa usando `lead_messages` en Postgres. Es lo suficientemente robusto. No se necesitan cambios de esquema para `lead_messages`.

## 6. Plan de Implementación (Modo Código)

1. **Base de Datos**:
    * Crear script de migración `migrations/001_add_scoring.sql`.
    * Actualizar `services/initDb.js` para ejecutar esta migración o incluir el esquema en la inicialización fresca.
2. **Servicios**:
    * Crear `services/scoringService.js`.
    * Actualizar `services/leadDbService.js`.
3. **Controlador/API** (Opcional pero bueno):
    * Añadir endpoints para CRUD de `scoring_rules` para que el frontend pueda configurarlos.
4. **Lógica del Bot**:
    * Modificar `services/baileysManager.js` para importar y usar `scoringService`.
