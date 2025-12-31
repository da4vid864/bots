#!/bin/bash
# setup-analyzed-chats.sh - Script de instalación rápida

echo "🚀 Configurando Sistema de Análisis de Chats"
echo "=============================================="

# 1. Verificar dependencias
echo "✓ Verificando dependencias..."
npm list axios pg pino > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "⚠️ Instalando dependencias..."
  npm install axios pg pino jsonwebtoken
fi

# 2. Aplicar migraciones
echo "✓ Aplicando migraciones de BD..."
if [ -f "migrate.js" ]; then
  node migrate.js
  echo "✅ Migraciones aplicadas"
else
  echo "⚠️ No se encontró migrate.js"
  echo "Ejecutar manualmente:"
  echo "  psql -d your_db -f migrations/013_analyzed_chats_system.sql"
fi

# 3. Verificar archivo .env
echo "✓ Verificando variables de entorno..."
if ! grep -q "DEEPSEEK_API_KEY" .env; then
  echo "⚠️ DEEPSEEK_API_KEY no configurada en .env"
  echo "Agregá: DEEPSEEK_API_KEY=sk-..."
fi

# 4. Resumen
echo ""
echo "✅ INSTALACIÓN COMPLETADA"
echo "=============================================="
echo ""
echo "Siguientes pasos:"
echo ""
echo "1. Actualizar .env si es necesario:"
echo "   - DEEPSEEK_API_KEY=sk-..."
echo "   - DATABASE_URL=postgresql://..."
echo ""
echo "2. Reiniciar servidor:"
echo "   npm run dev"
echo ""
echo "3. Acceder a Sales Panel Mejorado:"
echo "   http://localhost:3001/sales-ai"
echo ""
echo "4. Ver documentación:"
echo "   cat ANALYZED_CHATS_INTEGRATION.md"
echo "   cat IMPLEMENTATION_SUMMARY.md"
echo ""
