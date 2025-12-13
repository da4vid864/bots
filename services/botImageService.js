// services/botImageService.js
const pool = require('./db');

/**
 * Guarda la referencia de una imagen en la base de datos
 * Uso nuevo:
 *   addImage(botId, storageKey, originalName, keyword, url)
 */
async function addImage(botId, storageKey, originalName, keyword, url) {
  try {
    const normalizedKeyword = keyword.toLowerCase().trim();

    const result = await pool.query(
      `INSERT INTO bot_images (bot_id, filename, original_name, keyword, storage_key, url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        botId,
        storageKey,      // usamos filename = storageKey por compatibilidad con código antiguo
        originalName,
        normalizedKeyword,
        storageKey,
        url,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error agregando imagen a BD:', error);
    throw error;
  }
}

/**
 * Obtiene todas las imágenes de un bot
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
    const normalizedKeyword = keyword.toLowerCase().trim();

    const result = await pool.query(
      'SELECT * FROM bot_images WHERE bot_id = $1 AND keyword = $2 LIMIT 1',
      [botId, normalizedKeyword]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error buscando imagen por keyword:', error);
    return null;
  }
}

/**
 * Elimina una imagen de la BD y devuelve el registro eliminado
 */
async function deleteImage(imageId) {
  try {
    const result = await pool.query(
      'DELETE FROM bot_images WHERE id = $1 RETURNING *',
      [imageId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error eliminando imagen de BD:', error);
    throw error;
  }
}

/**
 * Devuelve el objeto que Baileys puede usar directamente:
 * await sock.sendMessage(jid, media)
 */
async function getImageMedia(keyword, botId) {
  try {
    const image = await getImageByKeyword(botId, keyword);

    if (!image || !image.url) {
      console.log(
        `[BotImageService] Imagen no encontrada o sin URL para keyword "${keyword}" (bot: ${botId})`
      );
      return null;
    }

    return {
      image: { url: image.url },
      caption: image.keyword || image.original_name || '',
    };
  } catch (error) {
    console.error('[BotImageService] Error obteniendo media de imagen:', error);
    return null;
  }
}

module.exports = {
  addImage,
  getImagesByBot,
  getImageByKeyword,
  getImageMedia,
  deleteImage,
};