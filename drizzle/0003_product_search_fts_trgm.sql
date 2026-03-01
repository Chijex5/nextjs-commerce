CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS products_search_vector_idx
ON products
USING gin (
  (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(handle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(seo_title, '') || ' ' || coalesce(seo_description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  )
);

CREATE INDEX IF NOT EXISTS products_search_text_trgm_idx
ON products
USING gin (
  lower(
    coalesce(title, '') ||
    ' ' || coalesce(handle, '') ||
    ' ' || coalesce(description, '') ||
    ' ' || coalesce(seo_title, '') ||
    ' ' || coalesce(seo_description, '')
  ) gin_trgm_ops
);

CREATE INDEX IF NOT EXISTS product_variants_title_trgm_idx
ON product_variants
USING gin (lower(title) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS product_variants_selected_options_trgm_idx
ON product_variants
USING gin (lower(selected_options::text) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS product_options_search_trgm_idx
ON product_options
USING gin (
  lower(
    coalesce(name, '')
  ) gin_trgm_ops
);

CREATE INDEX IF NOT EXISTS collections_search_trgm_idx
ON collections
USING gin (
  lower(
    coalesce(title, '') ||
    ' ' || coalesce(handle, '') ||
    ' ' || coalesce(description, '')
  ) gin_trgm_ops
);
