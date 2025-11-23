-- Add `grouping` column to store high-level group (e.g. 'Filtros')
ALTER TABLE public.parts
  ADD COLUMN IF NOT EXISTS grouping text;

-- After adding the column, you can backfill existing rows if desired using an UPDATE statement
-- that maps current `category` values to `grouping` values.
