# Dev tooling: Development commands

## Getting started

```bash
npm install
npm run db:up        # start PostgreSQL (Docker)
npm run db:reset     # wait for DB, load schema + seed
npm run dev          # http://localhost:3000
```

With an existing database, `make start` starts PostgreSQL, waits for it, starts the customer support inbox on http://localhost:3100 (see `customer-support/README.md`) and runs the dev server in the foreground. Ctrl+C stops the dev server, the customer support inbox and PostgreSQL, and keeps the data. It fails before starting anything if port 3000 or 3100 is already in use.

## Scripts

- `npm run dev` — dev server on http://localhost:3000.
- `npm run build` / `npm run typecheck` — production build / type-check only.
- `npm run test` / `npm run test:integration` — see [../testing/testing-strategy.md](../testing/testing-strategy.md).
- `npm run db:up` · `npm run db:reset` · `npm run db:schema` · `npm run db:seed` — database lifecycle.
- `npm run db:test:reset` — create/reset the `retail_test` database for integration tests.

There is no linter configured.

## Environment

`.env.local`: `DATABASE_URL` (default `postgres://retail:retail@localhost:55432/retail`), `POSTGRES_PORT` and `VERCEL_AI_GATEWAY_API_KEY`.

`VERCEL_AI_GATEWAY_API_KEY` is required: `EvaluationModelProductReviewSpamDetector` calls TypeSafe's Jev (`typesafe-ai/jev`) through Vercel AI Gateway with the AI SDK (`experimental_evaluate`) to detect spam in product reviews. Its integration tests call the real API.

Note for the workshop exercises: inside an exercise, `./cly start` wraps `db:up` + `db:reset` + `dev`, and `./cly test` wraps `test`.
