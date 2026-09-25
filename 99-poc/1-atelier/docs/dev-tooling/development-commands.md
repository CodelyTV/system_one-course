# Dev tooling: Development commands

## Getting started

```bash
npm install
npm run db:up        # start PostgreSQL (Docker)
npm run db:reset     # wait for DB, load schema + seed
npm run dev          # http://localhost:3000
```

## Scripts

- `npm run dev` — dev server on http://localhost:3000.
- `npm run build` / `npm run typecheck` — production build / type-check only.
- `npm run test` / `npm run test:integration` — see [../testing/testing-strategy.md](../testing/testing-strategy.md).
- `npm run db:up` · `npm run db:reset` · `npm run db:schema` · `npm run db:seed` — database lifecycle.
- `npm run db:test:reset` — create/reset the `retail_test` database for integration tests.

There is no linter configured.

## Environment

`.env.local`: `DATABASE_URL` (default `postgres://retail:retail@localhost:55432/retail`) and `POSTGRES_PORT`.

Note for the workshop exercises: inside an exercise, `./cly start` wraps `db:up` + `db:reset` + `dev`, and `./cly test` wraps `test`.
