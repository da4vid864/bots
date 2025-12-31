/**
 * exportService.js
 * Servicio para exportar datos de clientes y chats analizados en diferentes formatos
 */

const fs = require('fs');
const path = require('path');
const pool = require('./db');

/**
 * Convertir array de objetos a CSV
 * @param {Array} data - Datos a convertir
 * @param {Array} columns - Columnas a incluir (opcional, usa todas si no se especifica)
 * @returns {string} Contenido en formato CSV
 */
function convertToCSV(data, columns = null) {
  if (!data || data.length === 0) {
    return '';
  }

  // Determinar columnas
  let cols = columns;
  if (!cols) {
    cols = Object.keys(data[0]);
  }

  // Crear encabezado
  const header = cols.map(col => `"${col}"`).join(',');

  // Crear filas
  const rows = data.map(row => {
    return cols.map(col => {
      const value = row[col] ?? '';
      // Escapar comillas y envolver valores con comas
      const strValue = String(value).replace(/"/g, '""');
      return `"${strValue}"`;
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Exportar todos los clientes/chats analizados en CSV
 * @param {string} tenantId - ID del tenant
 * @returns {Promise<{csv: string, filename: string}>}
 */
async function exportAnalyzedChatsToCSV(tenantId) {
  try {
    const query = `
      SELECT 
        ac.id,
        ac.phone,
        ac.contact_name,
        ac.pipeline_category,
        ac.lead_score,
        ac.engagement,
        ac.confidence,
        ac.urgency,
        ac.product_interest,
        ac.sentiment,
        ac.assigned_to,
        ac.last_message,
        ac.message_count,
        ac.last_message_date,
        ac.created_at,
        ac.updated_at,
        ac.metadata
      FROM analyzed_chats ac
      WHERE ac.tenant_id = $1
      ORDER BY ac.lead_score DESC, ac.updated_at DESC
    `;

    const result = await pool.query(query, [tenantId]);
    const data = result.rows;

    // Formatear datos para CSV
    const csvData = data.map(row => ({
      'ID Chat': row.id,
      'Teléfono': row.phone,
      'Nombre Contacto': row.contact_name || 'N/A',
      'Categoría Pipeline': row.pipeline_category,
      'Puntuación Lead': row.lead_score?.toFixed(2) || '0',
      'Engagement': row.engagement?.toFixed(2) || '0',
      'Confianza': row.confidence?.toFixed(2) || '0',
      'Urgencia': row.urgency?.toFixed(2) || '0',
      'Interés Producto': row.product_interest?.toFixed(2) || '0',
      'Sentimiento': row.sentiment || 'N/A',
      'Asignado a': row.assigned_to || 'Sin asignar',
      'Último Mensaje': row.last_message || 'N/A',
      'Total Mensajes': row.message_count || 0,
      'Fecha Último Mensaje': row.last_message_date ? new Date(row.last_message_date).toLocaleString('es-MX') : 'N/A',
      'Fecha Creación': row.created_at ? new Date(row.created_at).toLocaleString('es-MX') : 'N/A',
      'Fecha Actualización': row.updated_at ? new Date(row.updated_at).toLocaleString('es-MX') : 'N/A'
    }));

    const csv = convertToCSV(csvData);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `chats-analizados-${timestamp}.csv`;

    return { csv, filename, rowCount: data.length };
  } catch (error) {
    console.error('❌ Error al exportar chats a CSV:', error);
    throw error;
  }
}

/**
 * Exportar chats por categoría en CSV
 * @param {string} tenantId - ID del tenant
 * @param {string} category - Categoría del pipeline
 * @returns {Promise<{csv: string, filename: string}>}
 */
async function exportChatsByCategoryToCSV(tenantId, category) {
  try {
    const query = `
      SELECT 
        ac.id,
        ac.phone,
        ac.contact_name,
        ac.pipeline_category,
        ac.lead_score,
        ac.engagement,
        ac.confidence,
        ac.urgency,
        ac.product_interest,
        ac.sentiment,
        ac.assigned_to,
        ac.last_message,
        ac.message_count,
        ac.last_message_date,
        ac.updated_at
      FROM analyzed_chats ac
      WHERE ac.tenant_id = $1 AND ac.pipeline_category = $2
      ORDER BY ac.lead_score DESC
    `;

    const result = await pool.query(query, [tenantId, category]);
    const data = result.rows;

    const csvData = data.map(row => ({
      'Teléfono': row.phone,
      'Nombre Contacto': row.contact_name || 'N/A',
      'Puntuación Lead': row.lead_score?.toFixed(2) || '0',
      'Engagement': row.engagement?.toFixed(2) || '0',
      'Confianza': row.confidence?.toFixed(2) || '0',
      'Urgencia': row.urgency?.toFixed(2) || '0',
      'Interés Producto': row.product_interest?.toFixed(2) || '0',
      'Sentimiento': row.sentiment || 'N/A',
      'Asignado a': row.assigned_to || 'Sin asignar',
      'Último Mensaje': row.last_message || 'N/A',
      'Total Mensajes': row.message_count || 0,
      'Actualización': row.updated_at ? new Date(row.updated_at).toLocaleString('es-MX') : 'N/A'
    }));

    const csv = convertToCSV(csvData);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `chats-${category}-${timestamp}.csv`;

    return { csv, filename, rowCount: data.length };
  } catch (error) {
    console.error(`❌ Error al exportar chats de categoría ${category}:`, error);
    throw error;
  }
}

/**
 * Exportar leads de alto valor (puntuación > umbral) en CSV
 * @param {string} tenantId - ID del tenant
 * @param {number} minScore - Puntuación mínima (default: 70)
 * @returns {Promise<{csv: string, filename: string}>}
 */
async function exportHighValueLeadsToCSV(tenantId, minScore = 70) {
  try {
    const query = `
      SELECT 
        ac.id,
        ac.phone,
        ac.contact_name,
        ac.pipeline_category,
        ac.lead_score,
        ac.engagement,
        ac.confidence,
        ac.urgency,
        ac.product_interest,
        ac.sentiment,
        ac.assigned_to,
        ac.last_message,
        ac.message_count,
        ac.updated_at,
        cad.detalles_adicionales
      FROM analyzed_chats ac
      LEFT JOIN chat_analysis_details cad ON ac.id = cad.chat_id
      WHERE ac.tenant_id = $1 AND ac.lead_score >= $2
      ORDER BY ac.lead_score DESC
    `;

    const result = await pool.query(query, [tenantId, minScore]);
    const data = result.rows;

    const csvData = data.map(row => ({
      'Teléfono': row.phone,
      'Nombre Contacto': row.contact_name || 'N/A',
      'Categoría': row.pipeline_category,
      'Puntuación Lead': row.lead_score?.toFixed(2) || '0',
      'Confianza': row.confidence?.toFixed(2) || '0',
      'Urgencia': row.urgency?.toFixed(2) || '0',
      'Interés Producto': row.product_interest?.toFixed(2) || '0',
      'Sentimiento': row.sentiment || 'N/A',
      'Asignado a': row.assigned_to || 'Sin asignar',
      'Detalles': row.detalles_adicionales ? JSON.stringify(JSON.parse(row.detalles_adicionales).productosMencionados || []).substring(0, 50) : 'N/A'
    }));

    const csv = convertToCSV(csvData);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `leads-alto-valor-${timestamp}.csv`;

    return { csv, filename, rowCount: data.length };
  } catch (error) {
    console.error('❌ Error al exportar leads de alto valor:', error);
    throw error;
  }
}

/**
 * Exportar resumen de estadísticas en CSV
 * @param {string} tenantId - ID del tenant
 * @returns {Promise<{csv: string, filename: string}>}
 */
async function exportStatisticsToCSV(tenantId) {
  try {
    const query = `
      SELECT 
        ps.month_year,
        ps.total_chats,
        ps.avg_lead_score,
        ps.total_engaged,
        ps.total_interested,
        ps.messages_analyzed,
        ps.assigned_leads
      FROM pipeline_statistics ps
      WHERE ps.tenant_id = $1
      ORDER BY ps.month_year DESC
    `;

    const result = await pool.query(query, [tenantId]);
    const data = result.rows;

    const csvData = data.map(row => ({
      'Mes': row.month_year || 'Actual',
      'Total Chats': row.total_chats || 0,
      'Puntuación Promedio': row.avg_lead_score?.toFixed(2) || '0',
      'Comprometidos': row.total_engaged || 0,
      'Interesados': row.total_interested || 0,
      'Mensajes Analizados': row.messages_analyzed || 0,
      'Leads Asignados': row.assigned_leads || 0
    }));

    const csv = convertToCSV(csvData);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `estadisticas-${timestamp}.csv`;

    return { csv, filename, rowCount: data.length };
  } catch (error) {
    console.error('❌ Error al exportar estadísticas:', error);
    throw error;
  }
}

/**
 * Guardar archivo CSV en disco
 * @param {string} csv - Contenido CSV
 * @param {string} filename - Nombre del archivo
 * @param {string} outputDir - Directorio de salida (default: ./exports)
 * @returns {Promise<string>} Ruta completa del archivo guardado
 */
async function saveCSVFile(csv, filename, outputDir = null) {
  try {
    const dir = outputDir || path.join(__dirname, '..', 'exports');
    
    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, csv, 'utf8');
    
    console.log(`✅ Archivo CSV guardado: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('❌ Error al guardar archivo CSV:', error);
    throw error;
  }
}

/**
 * Exportar datos de clientes asignados a un usuario específico
 * @param {string} tenantId - ID del tenant
 * @param {string} assignedTo - Usuario asignado
 * @returns {Promise<{csv: string, filename: string}>}
 */
async function exportAssignedChatsToCSV(tenantId, assignedTo) {
  try {
    const query = `
      SELECT 
        ac.id,
        ac.phone,
        ac.contact_name,
        ac.pipeline_category,
        ac.lead_score,
        ac.engagement,
        ac.confidence,
        ac.urgency,
        ac.product_interest,
        ac.sentiment,
        ac.last_message,
        ac.message_count,
        ac.updated_at
      FROM analyzed_chats ac
      WHERE ac.tenant_id = $1 AND ac.assigned_to = $2
      ORDER BY ac.lead_score DESC
    `;

    const result = await pool.query(query, [tenantId, assignedTo]);
    const data = result.rows;

    const csvData = data.map(row => ({
      'Teléfono': row.phone,
      'Nombre Contacto': row.contact_name || 'N/A',
      'Categoría': row.pipeline_category,
      'Puntuación Lead': row.lead_score?.toFixed(2) || '0',
      'Engagement': row.engagement?.toFixed(2) || '0',
      'Confianza': row.confidence?.toFixed(2) || '0',
      'Urgencia': row.urgency?.toFixed(2) || '0',
      'Interés Producto': row.product_interest?.toFixed(2) || '0',
      'Sentimiento': row.sentiment || 'N/A',
      'Último Mensaje': row.last_message || 'N/A',
      'Mensajes': row.message_count || 0,
      'Actualizado': row.updated_at ? new Date(row.updated_at).toLocaleString('es-MX') : 'N/A'
    }));

    const csv = convertToCSV(csvData);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `clientes-${assignedTo}-${timestamp}.csv`;

    return { csv, filename, rowCount: data.length };
  } catch (error) {
    console.error(`❌ Error al exportar chats asignados a ${assignedTo}:`, error);
    throw error;
  }
}

module.exports = {
  convertToCSV,
  exportAnalyzedChatsToCSV,
  exportChatsByCategoryToCSV,
  exportHighValueLeadsToCSV,
  exportStatisticsToCSV,
  saveCSVFile,
  exportAssignedChatsToCSV
};
