# Testing: Testing strategy

Tests live in `tests/`, mirroring `src/contexts` (`backend/`, `frontend/`, `shared/`). All files are `*.spec.ts`, run with Vitest.

## Unit tests

- Command: `npm run test`.
- Scope: everything under `tests/` except `infrastructure/` folders (see `vitest.config.ts`).
- Test use cases through their public API with in-memory or mocked repositories; don't test domain classes in isolation if a use case covers them.

## Integration tests

- Command: `npm run test:integration` (requires the database up; create the test database first with `npm run db:test:reset`).
- Scope: `tests/**/infrastructure/**` (see `vitest.integration.config.ts`) — real PostgreSQL repository implementations against the `retail_test` database.
- Repository implementations belong here, not in unit tests.
