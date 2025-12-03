const pool = require('./db');

async function addProduct(botId, productData) {
    const { sku, name, description, price, currency, image_url, tags, stock_status } = productData;
    
    const result = await pool.query(
        `INSERT INTO products (bot_id, sku, name, description, price, currency, image_url, tags, stock_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [botId, sku, name, description, price, currency || 'MXN', image_url, tags || [], stock_status || 'in_stock']
    );
    return result.rows[0];
}

async function getProductsByBot(botId) {
    const result = await pool.query(
        `SELECT * FROM products WHERE bot_id = $1 ORDER BY created_at DESC`,
        [botId]
    );
    return result.rows;
}

async function getProductBySku(botId, sku) {
    const result = await pool.query(
        `SELECT * FROM products WHERE bot_id = $1 AND sku = $2`,
        [botId, sku]
    );
    return result.rows[0];
}

async function updateProduct(id, productData) {
    const { sku, name, description, price, currency, image_url, tags, stock_status } = productData;
    
    const result = await pool.query(
        `UPDATE products 
         SET sku = $1, name = $2, description = $3, price = $4, currency = $5, image_url = $6, tags = $7, stock_status = $8
         WHERE id = $9
         RETURNING *`,
        [sku, name, description, price, currency, image_url, tags, stock_status, id]
    );
    return result.rows[0];
}

async function deleteProduct(id) {
    const result = await pool.query(
        `DELETE FROM products WHERE id = $1 RETURNING id`,
        [id]
    );
    return result.rowCount > 0;
}

module.exports = {
    addProduct,
    getProductsByBot,
    getProductBySku,
    updateProduct,
    deleteProduct
};