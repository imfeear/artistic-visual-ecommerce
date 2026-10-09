-- Execute manually with psql when schema changes are managed outside Hibernate.
-- Existing products stay unclassified (NULL); no rows are deleted or reclassified.
BEGIN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category varchar(32);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_category_allowed' AND conrelid = 'products'::regclass
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_category_allowed CHECK (
            category IS NULL OR category IN (
                'brincos', 'esculturas', 'esculturas-biscuit', 'decoracao',
                'quadros', 'personalizadas', 'colecionaveis', 'outros-artesanatos'
            )
        ) NOT VALID;
    END IF;
END $$;
COMMIT;
