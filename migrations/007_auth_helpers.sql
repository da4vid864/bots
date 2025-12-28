BEGIN;

-- Function to get user by email bypassing RLS (SECURITY DEFINER)
-- Used during login to find the user and their tenant_id
CREATE OR REPLACE FUNCTION get_user_by_email_system(p_email TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    tenant_id UUID,
    is_active BOOLEAN,
    added_by TEXT,
    password_hash TEXT, -- Included if you switch to password auth later
    created_at TIMESTAMP
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY 
    SELECT u.id, u.email, u.role, u.tenant_id, u.is_active, u.added_by, u.password_hash, u.created_at
    FROM users u
    WHERE u.email = p_email;
END;
$$;

-- Function to create a new tenant and user atomically (SECURITY DEFINER)
-- Used during registration
CREATE OR REPLACE FUNCTION create_tenant_and_user_system(
    p_email TEXT,
    p_role TEXT,
    p_added_by TEXT
)
RETURNS TABLE (
    user_id UUID,
    tenant_id UUID
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    new_tenant_id UUID;
    new_user_id UUID;
BEGIN
    -- 1. Create the new tenant
    INSERT INTO tenants (name, plan, status)
    VALUES ('Tenant for ' || p_email, 'free', 'active')
    RETURNING id INTO new_tenant_id;

    -- 2. Create the user linked to this tenant
    INSERT INTO users (email, role, added_by, tenant_id)
    VALUES (p_email, p_role, p_added_by, new_tenant_id)
    RETURNING id INTO new_user_id;

    -- Return the IDs
    RETURN QUERY SELECT new_user_id, new_tenant_id;
END;
$$;

-- Function to add a user to an existing tenant (SECURITY DEFINER)
-- Used when an admin adds a team member
CREATE OR REPLACE FUNCTION add_user_to_tenant_system(
    p_email TEXT,
    p_role TEXT,
    p_added_by TEXT,
    p_tenant_id UUID
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO users (email, role, added_by, tenant_id)
    VALUES (p_email, p_role, p_added_by, p_tenant_id)
    RETURNING id INTO new_user_id;

    RETURN new_user_id;
END;
$$;

COMMIT;