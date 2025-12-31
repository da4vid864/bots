-- seed-pipeline-categories.sql
-- Script para poblar categorías iniciales del pipeline
-- Ejecutar después de la migración 013_analyzed_chats_system.sql

-- Obtener tenant_id (asume un solo tenant o que requiere bulk insert)
-- Para multi-tenant, ejecutar con SET search_path

BEGIN;

-- 1. Insertar categorías del pipeline
INSERT INTO pipeline_categories 
(tenant_id, name, display_name, description, color_code, position, min_score, max_score, is_active) 
VALUES 
-- Nuevos Contactos
(NULL, 'nuevos_contactos', 'Nuevos Contactos', 
 'Chats recibidos sin análisis completo o score bajo. Requieren seguimiento inicial.', 
 '#6b7280', 0, 0, 30, true),

-- Leads Calientes
(NULL, 'calientes', 'Leads Calientes', 
 'Alta probabilidad de conversión. Muestra interés genuino en productos/servicios. Score 70+', 
 '#ef4444', 1, 70, 100, true),

-- En Seguimiento
(NULL, 'seguimiento', 'En Seguimiento', 
 'Conversación activa. Cliente muestra interés moderado. Requiere contacto regular.', 
 '#3b82f6', 2, 40, 69, true),

-- Negociación
(NULL, 'negociacion', 'Negociación', 
 'Cliente discutiendo términos, precios o condiciones. Cerca de cerrar.', 
 '#f59e0b', 3, 50, 79, true),

-- Cerrar Venta
(NULL, 'cerrar_venta', 'Cerrar Venta', 
 'Cliente listo para comprar. Solo necesita confirmación final o cierre.', 
 '#10b981', 4, 75, 100, false),

-- Perdidos
(NULL, 'perdidos', 'Perdidos', 
 'Cliente sin interés, no contactable o rechazó la propuesta. Baja prioridad.', 
 '#8b5cf6', 5, 0, 25, true),

-- Clientes
(NULL, 'clientes', 'Clientes', 
 'Conversiones exitosas. Cliente ya realizó compra. Oportunidad de upsell.', 
 '#06b6d4', 6, 80, 100, true);

-- 2. Insertar palabras clave para clasificación automática
UPDATE pipeline_categories 
SET keywords = '["precio", "costo", "tarifa", "cuánto"]'::jsonb
WHERE name = 'negociacion';

UPDATE pipeline_categories 
SET keywords = '["gracias", "perfecto", "enviame", "proceder", "compro", "pagos"]'::jsonb
WHERE name = 'cerrar_venta';

UPDATE pipeline_categories 
SET keywords = '["no interesa", "no gracias", "después", "muy caro", "presupuesto apretado"]'::jsonb
WHERE name = 'perdidos';

-- 3. Insertar estadísticas iniciales para hoy
INSERT INTO pipeline_statistics 
(tenant_id, pipeline_category, total_chats, new_today, converted_this_month, lost_this_month, avg_lead_score, avg_time_in_category, conversion_rate, date_period)
VALUES 
(NULL, 'nuevos_contactos', 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE),
(NULL, 'calientes', 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE),
(NULL, 'seguimiento', 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE),
(NULL, 'negociacion', 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE),
(NULL, 'cerrar_venta', 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE),
(NULL, 'perdidos', 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE),
(NULL, 'clientes', 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE)
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificar que se insertaron correctamente
SELECT name, display_name, color_code, position, is_active 
FROM pipeline_categories 
ORDER BY position;
