# SQL database: Data model

PostgreSQL runs in Docker (see `compose.yml`). Schema and seed data live in `database/schema.sql` and `database/seed.sql`; the `db:reset` npm script applies both.

## Tables

- `products`, `product_variants` — catalog; variants carry size/color and online stock.
- `checkouts`, `checkout_lines` — in-progress carts.
- `orders`, `order_lines` — confirmed purchases.
- `product_reviews` — customer reviews (rating 1-5 and optional comment), many per customer and product, with a `pending-validation`, `published` or `spam` status and, once published, a topic `label` (`product`, `shipping`, `packaging`, `customer-service`, `price` or `other`).
- `users` — customers (no auth: the current user is faked, see `FakeSessionCurrentUserProvider`).

## Conventions

- Schema changes go into `database/schema.sql` (there is no migrations tool); re-apply with `npm run db:reset`.
- Access goes through the repositories in each context's `infrastructure/` layer, never raw SQL from `src/app/`.
