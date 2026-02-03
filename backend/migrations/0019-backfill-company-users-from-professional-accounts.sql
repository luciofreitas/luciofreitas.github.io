-- 0019 - Backfill company_users from professional_accounts
-- Date: 2026-02-03

-- Idempotent backfill: creates/updates membership records for already-approved professionals.
-- Rules:
-- - Only for professional_accounts with role=professional and status=active.
-- - Only when company_id is present and exists in companies.
-- - Does not overwrite an existing blocked membership.
-- - Does not change existing role; sets role='employee' only on insert.

INSERT INTO company_users (user_id, company_id, matricula, status, role, created_at, updated_at)
SELECT
  pa.user_id,
  pa.company_id,
  pa.matricula,
  'active' as status,
  'employee' as role,
  now(),
  now()
FROM professional_accounts pa
JOIN companies c ON c.id = pa.company_id
WHERE pa.company_id IS NOT NULL
  AND lower(COALESCE(pa.role, '')) IN ('professional','profissional')
  AND lower(COALESCE(pa.status, 'active')) IN ('active','ativo')
ON CONFLICT (user_id, company_id)
DO UPDATE SET
  matricula = COALESCE(company_users.matricula, EXCLUDED.matricula),
  status = CASE WHEN company_users.status = 'blocked' THEN 'blocked' ELSE 'active' END,
  updated_at = now();
