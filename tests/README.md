# Tests

| Command                 | What it runs                                          | Needs              |
| ----------------------- | ----------------------------------------------------- | ------------------ |
| `pnpm test`             | Unit tests (`tests/unit`)                             | nothing            |
| `pnpm test:integration` | API tests (`tests/integration`) against a running app | Postgres + the app |

CI (`.github/workflows/ci.yml`) runs the typecheck, unit tests, migrations on an
empty database, a production build and the integration suite on every PR.

## Running the integration suite locally

The suite **wipes the database** it points at, rebuilds it from `./drizzle`
and seeds fixtures (`tests/setup`). It refuses any host other than
`localhost`/`127.0.0.1` unless `ALLOW_REMOTE_TEST_DB=1` (for a disposable Neon
branch — never the main branch).

```bash
docker run -d --name dfp-pg -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=dfp_test -p 5432:5432 postgres:16

export DATABASE_SSL=disable
export NEON_DATABASE_URL=postgresql://postgres@localhost:5432/dfp_test
export NEON_DATABASE_URL_UNPOOLED=$NEON_DATABASE_URL
export TEST_DATABASE_URL=$NEON_DATABASE_URL
export TEST_BASE_URL=http://localhost:3000
export NEXTAUTH_SECRET=local-test NEXTAUTH_URL=$TEST_BASE_URL
export CRON_SECRET=local-cron UNSUBSCRIBE_SECRET=local-unsub
export CUSTOM_ORDER_REQUESTS_ENABLED=true

pnpm db:migrate && pnpm build && pnpm start &   # or `pnpm dev`
pnpm test:integration
```

`NEXTAUTH_SECRET` and `CRON_SECRET` must match between the app and the test
run: the suite signs admin session cookies and calls cron routes with them.
