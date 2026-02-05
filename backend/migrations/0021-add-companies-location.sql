-- 0021 - Add location/contact fields to companies for public partners listing
-- Date: 2026-02-05

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='companies'
  ) THEN
    -- Address fields
    ALTER TABLE public.companies
      ADD COLUMN IF NOT EXISTS cep TEXT,
      ADD COLUMN IF NOT EXISTS address_street TEXT,
      ADD COLUMN IF NOT EXISTS address_number TEXT,
      ADD COLUMN IF NOT EXISTS address_complement TEXT,
      ADD COLUMN IF NOT EXISTS neighborhood TEXT,
      ADD COLUMN IF NOT EXISTS city TEXT,
      ADD COLUMN IF NOT EXISTS state TEXT,
      ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'BR';

    -- Coordinates (WGS84)
    ALTER TABLE public.companies
      ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

    -- Public contact fields (optional)
    ALTER TABLE public.companies
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp TEXT,
      ADD COLUMN IF NOT EXISTS website TEXT,
      ADD COLUMN IF NOT EXISTS instagram TEXT,
      ADD COLUMN IF NOT EXISTS public_notes TEXT;

    -- Helpful indexes for filters/search
    CREATE INDEX IF NOT EXISTS idx_companies_city ON public.companies(city);
    CREATE INDEX IF NOT EXISTS idx_companies_state ON public.companies(state);
    CREATE INDEX IF NOT EXISTS idx_companies_lat_lng ON public.companies(lat, lng);
  END IF;
END$$;
