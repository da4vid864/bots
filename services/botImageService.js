// services/botImageService.js
const pool = require('./db');
const fs = require('fs');
const path = require('path');

/**
 * Guarda la referencia de una imagen en la base de datos
 */
async function addImage(botId, filename, originalName, keyword) {
    try {
        const result = await pool.query(
            'INSERT INTO bot_images (bot_id, filename, original_name, keyword) VALUES ($1, $2, $3, $4) RETURNING *',
            [botId, filename, originalName, keyword.toLowerCase().trim()]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error agregando imagen a BD:', error);
        throw error;
    }
}

/**
 * Obtiene todas las imágenes activas de un bot
 */
async function getImagesByBot(botId) {
    try {
        const result = await pool.query(
            'SELECT * FROM bot_images WHERE bot_id = $1 ORDER BY created_at DESC',
            [botId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error obteniendo imágenes:', error);
        return [];
    }
}

/**
 * Busca una imagen específica por palabra clave
 */
async function getImageByKeyword(botId, keyword) {
    try {
        const result = await pool.query(
            'SELECT * FROM bot_images WHERE bot_id = $1 AND keyword = $2 LIMIT 1',
            [botId, keyword.toLowerCase().trim()]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error buscando imagen por keyword:', error);
        return null;
    }
}

/**
 * Obtiene el objeto de medios listo para Baileys
 * @param {string} keyword - Palabra clave de la imagen
 * @param {string} botId - ID del bot
 * @returns {Promise<Object|null>} Objeto con url y caption, o null si no existe
 */
async function getImageMedia(keyword, botId) {
    try {
        const image = await getImageByKeyword(botId, keyword);
        
        if (!image) {
            console.log(`[BotImageService] Imagen no encontrada en BD para keyword: ${keyword}`);
            return null;
        }

        const imagePath = path.join(__dirname, '..', 'public', 'uploads', image.filename);
        
        if (!fs.existsSync(imagePath)) {
            console.error(`[BotImageService] Archivo físico no encontrado: ${imagePath}`);
            return null;
        }

        return {
            image: { url: imagePath },
            caption: image.original_name
        };
    } catch (error) {
        console.error('[BotImageService] Error obteniendo media de imagen:', error);
        return null;
    }
}

/**
 * Elimina una imagen de la base de datos
 */
async function deleteImage(id) {
    try {
        const result = await pool.query('DELETE FROM bot_images WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        throw error;
    }
}

module.exports = { addImage, getImagesByBot, getImageByKeyword, deleteImage, getImageMedia };