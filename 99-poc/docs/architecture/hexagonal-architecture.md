# Architecture: Hexagonal architecture (DDD)

Each backend bounded context under `src/contexts/backend/<context>/` has three layers:

- `domain/` — entities, value objects, repository interfaces and domain errors. No framework or database imports.
- `application/` — one use case per folder, named after the action (e.g. `application/search/ProductsSearcher.ts`). Depends only on the domain layer.
- `infrastructure/` — adapters implementing the domain interfaces, mainly PostgreSQL repositories built on `backend/shared/infrastructure/PostgresRepository.ts`.

The dependency rule goes inwards: `infrastructure` → `application` → `domain`, never the other way.

## Dependency injection

Use cases are wired manually in `src/contexts/backend/shared/infrastructure/RetailContainer.ts`. Routes and server actions in `src/app/` resolve use cases through this container instead of instantiating repositories themselves. When you add a use case, register it there.

## Frontend

Frontend logic follows the same context split: `src/contexts/frontend/retail/` holds the app-specific `application/`, `sections/` and `ui/` code, while `src/contexts/frontend/design-system/` is app-agnostic and must not import from `retail/`.
