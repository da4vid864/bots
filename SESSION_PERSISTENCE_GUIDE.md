# 🔄 Session Persistence - Guía de Implementación

## Problema Resuelto
Anteriormente, cuando se reiniciaba el servidor o se hacía un push con cambios de versión, las sesiones de WhatsApp se perdían y era necesario escanear el QR nuevamente.

## Solución Implementada

### 1. **Session Persistence Service** (`sessionPersistenceService.js`)
Nuevo servicio que gestiona la persistencia de sesiones:

- **`hasValidSessionCredentials(botId)`** - Verifica si hay credenciales guardadas sin necesidad de QR
- **`saveSessionMetadata(botId, data)`** - Guarda metadata en BD para auditoría
- **`getSessionMetadata(botId)`** - Obtiene datos de sesión guardados
- **`cleanInvalidSession(botId)`** - Limpia sesiones rotas
- **`exportSessionBackup(botId)`** - Exporta backup de sesión
- **`restoreSessionFromBackup(botId)`** - Restaura sesión desde backup
- **`cleanupOldSessions()`** - Limpia sesiones muy antiguas (>30 días)

### 2. **Actualizado: Baileys Manager**
Integración con el nuevo servicio de persistencia:

```javascript
// Al inicializar:
const hasValidCreds = sessionPersistenceService.hasValidSessionCredentials(botId);
if (hasValidCreds) {
    console.log(`♻️  Reutilizando sesión anterior (sin necesidad de QR)`);
}

// Al conectar:
await sessionPersistenceService.saveSessionMetadata(botId, {
    phoneNumber: creds.me?.id,
    status: 'connected',
    authenticatedAt: new Date()
});

// Al desconectar:
if (hasValidCreds) {
    console.log(`ℹ️  Próximo reconexión: sin QR`);
}
```

### 3. **Nueva Migración: Migration 014**
Tabla `bot_sessions` para tracking:

```sql
CREATE TABLE bot_sessions (
    id UUID PRIMARY KEY,
    bot_id TEXT UNIQUE REFERENCES bots(id),
    phone VARCHAR(20),
    status VARCHAR(50),  -- connected, disconnected, reconnecting, error
    last_activity TIMESTAMP,
    authenticated_at TIMESTAMP,
    connection_attempts INTEGER,
    last_connection_error TEXT,
    metadata JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Cómo Funciona

### Flujo de Reinicio del Servidor (Antes vs Después)

#### ❌ ANTES:
```
Server Restart
    ↓
Bot inicializa
    ↓
¿Credenciales en archivo? SÍ
    ↓
Pero no las usa automáticamente
    ↓
Pide QR nuevo
    ↓
Usuario debe escanear QR 📱
```

#### ✅ DESPUÉS:
```
Server Restart
    ↓
Bot inicializa
    ↓
✅ "♻️ Reutilizando sesión anterior (sin necesidad de QR)"
    ↓
Valida credenciales guardadas
    ↓
Conecta automáticamente
    ↓
Sincroniza mensajes
    ↓
LISTO - Sin necesidad de QR
```

## Características

### ✅ Conexión Automática sin QR
Si las credenciales son válidas, se reutiliza la sesión automáticamente:

```
[ventas-mx] ♻️ Reutilizando sesión anterior (sin necesidad de QR)
[ventas-mx] ✅ WhatsApp conectado!
[ventas-mx] 🔄 Iniciando sincronización forzada...
```

### ✅ Auditoría en BD
Se registran todas las conexiones:

```sql
SELECT * FROM bot_sessions;
-- bot_id | phone | status | last_activity | authenticated_at
```

### ✅ Detección Inteligente
Si las credenciales no son válidas, lo detecta:

```
[bot-id] ⚠️ Credenciales incompletas
[bot-id] ⚠️ Próximo reconexión: necesitará escanear QR
```

### ✅ Backup y Restore
Se pueden exportar backups de sesiones:

```javascript
sessionPersistenceService.exportSessionBackup(botId);
// Exporta a: session-backups/[botId].backup.json
```

## Testing

Para verificar que todo funciona:

```bash
node test_session_persistence.js
```

Esto mostrará:
1. Qué bots tienen credenciales guardadas
2. Backups exportados
3. Sesiones en BD

## Flujo Típico

### 1️⃣ Primera Conexión (Requiere QR):
```
[bot] 🔍 Inicializando conexión
[bot] ⚠️ Sin carpeta auth-sessions
[bot] 📱 Escaneando QR...
[bot] ✅ WhatsApp conectado!
[bot] 💾 Guardando credenciales
```

### 2️⃣ Reinicio del Servidor (Sin QR):
```
[bot] 🔍 Inicializando conexión
[bot] ✅ Credenciales válidas encontradas
[bot] ♻️ Reutilizando sesión anterior
[bot] ✅ WhatsApp conectado!
[bot] 🔄 Sincronizando mensajes...
```

### 3️⃣ Cambios de Versión (Push):
```
Push realizado
↓
Server reinicia con nuevo código
↓
[bot] ♻️ Reutilizando sesión anterior
↓
Conexión automática
↓
LISTO - sin interrupciones
```

## Archivos Involucrados

| Archivo | Cambio |
|---------|--------|
| `services/sessionPersistenceService.js` | ✨ NUEVO - Servicio de persistencia |
| `services/baileysManager.js` | 📝 Actualizado - Integración con persistencia |
| `migrations/014_bot_sessions_persistence.sql` | ✨ NUEVA - Tabla y vistas |

## Ejecución

La migración ya se ejecutó:
```bash
✅ Migración completada exitosamente.
```

Los cambios están listos en el servidor. La próxima vez que se reinicie:

```
Reinicio servidor
    ↓
Bots con sesiones válidas → Reconectarán automáticamente SIN QR
Bots sin sesiones previas → Pedirán QR como antes
```

## Próximas Mejoras (Opcional)

- [ ] Dashboard que muestre estado de todas las sesiones
- [ ] Alertas si una sesión no se puede recuperar
- [ ] Herramienta para forzar re-autenticación de un bot
- [ ] Estadísticas de tiempo de conexión/desconexión
- [ ] Rotación automática de credenciales para seguridad

## FAQ

**P: ¿Por qué necesito la migración 014?**
R: Para almacenar metadata de sesiones en BD. Permite auditoría y tracking de conexiones.

**P: ¿Qué pasa si borro los archivos de auth-sessions?**
R: Se pedirá QR nuevamente. Los archivos son esenciales.

**P: ¿Se sincronizarán los mensajes antiguos?**
R: Sí, automáticamente al conectar con credenciales válidas. Baileys hace sync del historio.

**P: ¿Es seguro guardar las credenciales?**
R: Sí, se guardan en archivos locales con permisos restrictivos. En producción, considera encriptar.

---

**Status:** ✅ Implementado y funcionando
**Última actualización:** 30 de diciembre de 2025
