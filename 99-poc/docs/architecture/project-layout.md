# Architecture: Project layout

- `src/app/` — App Router routes, server actions (`src/app/actions/`) and route-local `*.module.scss` styles.
- `src/contexts/backend/` — business logic by bounded context (`products`, `checkout`, `orders`, `users`), each split into `domain/application/infrastructure`. See [hexagonal-architecture.md](./hexagonal-architecture.md).
- `src/contexts/frontend/` — `design-system/` (the Codely design system: settings, atoms, molecules, objects, icons) and `retail/` (app-specific sections, UI components and frontend application logic).
- `src/contexts/shared/` — domain primitives shared across contexts (value objects).
- `database/` — `schema.sql` and `seed.sql`, applied by the `db:*` npm scripts.
- `tests/` — mirrors `src/contexts` (`backend/`, `frontend/`, `shared/`). See [../testing/testing-strategy.md](../testing/testing-strategy.md).
- `public/products/` — placeholder product images (see `public/products/CREDITS.md`).
