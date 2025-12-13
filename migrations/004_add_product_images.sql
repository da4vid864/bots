BEGIN;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS image_storage_key text;

CREATE INDEX IF NOT EXISTS idx_products_bot_id ON products(bot_id);

COMMIT;