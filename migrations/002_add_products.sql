CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    bot_id TEXT NOT NULL,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'MXN',
    image_url TEXT,
    tags TEXT[],
    stock_status TEXT DEFAULT 'in_stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bot_id, sku),
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
);