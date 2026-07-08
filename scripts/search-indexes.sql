-- Search performance indexes for the product catalogue.
--
-- WHY: getProducts() in lib/db/queries.ts builds tsvectors on the fly and runs
-- pg_trgm similarity / ILIKE across every row on each search. Without the
-- indexes below that is a full sequential scan per query — the single biggest
-- DB cost on the storefront. These indexes let the `%` (similarity), ILIKE and
-- `@@` (full-text) operators use GIN indexes instead of scanning.
--
-- These are additive and safe to run against production. CREATE INDEX
-- CONCURRENTLY avoids locking the table (run each statement outside a
-- transaction). Apply with:
--   psql "$DATABASE_URL" -f scripts/search-indexes.sql

-- Required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for fuzzy / ILIKE matching on the hot columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_title_trgm_idx
  ON products USING gin (lower(title) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS products_handle_trgm_idx
  ON products USING gin (lower(handle) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS products_description_trgm_idx
  ON products USING gin (lower(coalesce(description, '')) gin_trgm_ops);

-- Full-text index matching the tsvector the query builds (simple config,
-- title + tags weighted highest). Covers the `@@` filter path.
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_search_tsv_idx
  ON products USING gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '') || ' ' ||
      coalesce(handle, '')
    )
  );

-- Partial index for the very common "available products, newest first" listing.
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_available_created_idx
  ON products (created_at DESC)
  WHERE available_for_sale = true;
