# Codebase Audit & Recommendations

_Date: 2026-02-17_

## Scope

This audit focused on production risk and feature completeness checks across storefront, reviews, build tooling, and type-safety.

## What I checked

- Static scans for incomplete markers (`TODO`, `FIXME`, `any`, etc.).
- Build, lint, and TypeScript validation commands.
- Review-related API and UI implementation for data exposure and feature completeness.

## Findings

### 1) Lint command is currently broken with ESLint v9 migration

- `pnpm lint` fails because the project script calls `eslint` directly, but no `eslint.config.(js|mjs|cjs)` is present for ESLint v9 flat config.
- Impact: CI/static quality checks are unreliable unless lint tooling is updated.
- Recommendation:
  - Either migrate to flat config (`eslint.config.mjs`) or pin ESLint to v8-compatible setup.
  - Add lint run to CI to prevent silent regressions.

### 2) Build portability risk due to Google Font network dependency

- `next build` failed when fetching Inter from Google Fonts.
- Impact: builds can fail in restricted networks/CI agents with blocked external fetches.
- Recommendation:
  - Switch to self-hosted font strategy (e.g., local font files) for deterministic builds.
  - Optionally provide fallback font strategy in restricted environments.

### 3) Review endpoint allowed client-controlled status filtering

- The public reviews GET endpoint accepted `status` from query params.
- This could allow fetching non-approved reviews by passing a different status value.
- Fix applied: endpoint now always returns `approved` reviews only.

### 4) TypeScript compile failure in readonly products query builder

- `pnpm exec tsc --noEmit` reported type errors from reassignment of Drizzle query builder type after `orderBy`.
- Fix applied: refactored to use a base query and branch-specific awaited queries without unsafe reassignment.

### 5) Review image upload is marked incomplete

- `ReviewForm` still submits `images: []` with an explicit TODO comment.
- Impact: user expectation mismatch for richer review capability.
- Recommendation:
  - Add image upload support (client compression, moderation queue, storage policy).

## Feature recommendations (high-value additions)

1. **Wishlist + Back-in-stock notifications**
   - Captures purchase intent, improves retention, and enables CRM automations.
2. **Product comparison for footwear sizing/features**
   - High value for decision-heavy products; reduces pre-purchase uncertainty.
3. **Post-purchase fit feedback loop**
   - Collect "fits small/true/large" to improve recommendations and lower returns.
4. **Advanced review trust signals**
   - Photo/video badges, verified-purchase prominence, helpful-vote sorting.
5. **Saved carts across devices**
   - Link cart to authenticated user profile and send contextual recover emails.
6. **Low-stock urgency + size availability analytics**
   - Helps conversion and informs inventory planning.

## Suggested next actions (priority order)

1. Fix lint configuration migration.
2. Adopt deterministic font loading for build stability.
3. Complete review image upload pipeline.
4. Add CI gates for lint + typecheck + build.
5. Implement one growth feature (wishlist/back-in-stock is fastest ROI).

## Additional recommendation: Support & Customer Care

Support and customer care can be a major conversion and retention lever for this store category.

### Why it matters

- Footwear purchases often require guidance (fit, sizing, exchange questions) before checkout.
- Fast and reliable support directly reduces abandoned carts and return friction.
- Good care increases repeat purchase trust and review quality.

### Recommended implementation (phased)

1. **Tiered support entry points (quick wins)**
   - Add contextual support CTAs on PDP, cart, checkout, and order-tracking pages.
   - Use intent-based prompts: sizing help, delivery ETA, exchange/return policy.
2. **Unified support inbox + SLA tracking**
   - Route contact form, email, and social messages into one queue.
   - Define first-response and resolution SLAs (e.g., first response < 30 minutes in business hours).
3. **Self-service knowledge base**
   - Build searchable guides for sizing, shipping timelines, returns/exchanges, and order troubleshooting.
   - Surface suggested articles before a ticket is submitted.
4. **Order-linked support context**
   - Let customers open support requests from their account/order page with order metadata attached.
   - Pre-fill order number, item, size, and courier status to reduce back-and-forth.
5. **Support analytics and quality loop**
   - Track top contact reasons, CSAT, resolution time, and refund/return correlation.
   - Feed repetitive issues into product page copy and FAQ improvements.

### Suggested KPIs

- First Response Time (FRT)
- Time to Resolution (TTR)
- CSAT / post-ticket satisfaction score
- Contact rate per 100 orders
- Repeat purchase rate among customers who contacted support
