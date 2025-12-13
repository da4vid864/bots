-- migrations/003_add_is_qualified.sql
BEGIN;

-- 1) Agregar columna si no existe (nullable por ahora para poder backfillear)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS is_qualified boolean;

-- 2) Backfill (si ya tienes score, lo convertimos a is_qualified)
-- Ajusta el 70 si tu umbral real es otro
UPDATE leads
SET is_qualified = (COALESCE(score, 0) >= 70)
WHERE is_qualified IS NULL;

-- 3) Default + NOT NULL
ALTER TABLE leads
ALTER COLUMN is_qualified SET DEFAULT false;

ALTER TABLE leads
ALTER COLUMN is_qualified SET NOT NULL;

-- 4) Trigger para mantener is_qualified SIEMPRE sincronizado con score
CREATE OR REPLACE FUNCTION leads_sync_is_qualified()
RETURNS trigger AS $$
BEGIN
  NEW.is_qualified := (COALESCE(NEW.score, 0) >= 70);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_sync_is_qualified ON leads;

CREATE TRIGGER trg_leads_sync_is_qualified
BEFORE INSERT OR UPDATE OF score ON leads
FOR EACH ROW
EXECUTE FUNCTION leads_sync_is_qualified();

-- 5) Índice útil para queries por bot + calificado
CREATE INDEX IF NOT EXISTS idx_leads_bot_is_qualified
ON leads (bot_id, is_qualified);

COMMIT;