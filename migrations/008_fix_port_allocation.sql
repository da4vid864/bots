BEGIN;

-- Function to get the max port globally (ignoring RLS)
-- This ensures we don't allocate a duplicate port when creating a bot
CREATE OR REPLACE FUNCTION get_max_port_system()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    max_p INTEGER;
BEGIN
    SELECT MAX(port) INTO max_p FROM bots;
    RETURN COALESCE(max_p, 3000);
END;
$$;

COMMIT;