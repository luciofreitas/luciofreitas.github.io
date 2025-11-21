-- SQL to create a simple `parts` table suitable for the import script.
-- Run this in the Supabase SQL editor (Database -> Query) or via psql.

CREATE TABLE IF NOT EXISTS public.parts (
  id text PRIMARY KEY,
  name text,
  category text,
  manufacturer text,
  part_number text,
  description text,
  specifications jsonb,
  applications text[],
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parts_part_number_idx ON public.parts (part_number);
CREATE INDEX IF NOT EXISTS parts_category_idx ON public.parts (category);
