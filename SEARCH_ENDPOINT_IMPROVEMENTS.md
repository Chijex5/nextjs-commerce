# Search Endpoint Review & Improvement Plan

This review covers the current storefront search experience (`/search`) across UI and backend data retrieval.

## What is currently working well

- Search is server-rendered and SEO-safe, with metadata already set up for `/search`.
- Sorting controls and collection filters are integrated in the search layout.
- The redesigned page has improved visual hierarchy and stronger empty-state guidance.

## Implementation status

- ✅ Implemented: broader matching (title + description + tags).
- ✅ Implemented: price sorting by minimum variant price.
- ✅ Implemented: inline search refine input with quick clear action in the `/search` header.
- ⏳ Next: faceted filters (price range, availability, tags).
- ⏳ Next: ranked relevance (PostgreSQL FTS / `pg_trgm`).
- ✅ Implemented: paginated search results with page controls (12 per page).
- ⏳ Next: analytics instrumentation.

## Backend observations

### 1) Query matching is basic (title only in original flow)

- **Impact:** misses relevant products when users search by tags or description text.
- **Current improvement applied:** search matching now checks title, description, and tags text.

### 2) Price sorting logic correctness

- **Impact:** prior price sort path ordered by title, which can feel random and incorrect to users.
- **Current improvement applied:** price sorting now orders by each product's minimum variant price.

### 3) Result window / pagination

- **Current behavior:** hard limit of 100 results.
- **Recommendation:** add cursor- or page-based pagination to support large catalogs and faster perceived loads.

### 4) Ranking quality

- **Current behavior:** partial `ILIKE` matching without score/rank.
- **Recommendation:** introduce weighted ranking (exact title > prefix > partial > tags/description) using PostgreSQL full-text search (`tsvector`) or trigram similarity (`pg_trgm`).

### 5) Caching granularity

- **Current behavior:** cached product queries at the data layer with long cache life.
- **Recommendation:** add query-aware cache strategy and stale-while-revalidate behavior to avoid stale search result sets after frequent catalog changes.

## UI observations

### 1) Query controls

- **Current behavior:** results page explains state well, but lacks an inline search input for rapid refinement.
- **Recommendation:** add a prominent inline search box at the top of results to avoid navigation back-and-forth.

### 2) Filter depth

- **Current behavior:** sort and collection filters exist.
- **Recommendation:** add faceted filters (price range, availability, tags) with active filter chips and one-click clear.

### 3) Mobile ergonomics

- **Current behavior:** mobile filter bar exists.
- **Recommendation:** add sticky compact summary row (`N results`, active sort, quick clear) and preserve scroll position when returning from product details.

### 4) Empty-state guidance quality

- **Current behavior:** curated suggestions are available.
- **Recommendation:** personalize suggestions using top searched terms or recent user behavior instead of static terms.

## Metrics to add before/after changes

- Search conversion rate (search -> PDP -> add-to-cart -> checkout).
- Zero-result query rate.
- Time-to-first-result render.
- Refinement rate (users changing query/sort/filter).
- CTR per rank position.

## Suggested implementation order

1. **Correctness first:** keep price sort fix and broaden matching fields.
2. **UX speed:** add inline refine input + faceted filters.
3. **Relevance:** add ranked search with PostgreSQL FTS/trigram.
4. **Scale:** implement paginated loading and query analytics.
5. **Personalization:** dynamic suggestions and merchandising boosts.
