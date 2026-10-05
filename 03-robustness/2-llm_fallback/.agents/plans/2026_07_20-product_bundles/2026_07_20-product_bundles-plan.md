---
name: "Product Bundles"
description: "Let customers buy a predefined group of products at a discounted price, shown in the catalog and added to the cart as a single line item."
created_at: "2026-07-27T00:00:00Z"

created_by:
  tool: "Claude Code"
  model:
    name: "Claude Opus"
    version: "5.0"
    reasoning_effort: "high"
---

# Product Bundles

## Goal

Allow customers to buy a predefined group of at least two active products at a discounted price. Bundles live in a new `bundles` bounded context, are shown in the catalog alongside individual products, and are added to the cart as a single line item.

## Context

Relevant architecture and conventions to follow while implementing this plan:

- [`docs/architecture/hexagonal-architecture.md`](../../../docs/architecture/hexagonal-architecture.md): domain/application/infrastructure layering and manual DI in `RetailContainer`.
- [`docs/architecture/project-layout.md`](../../../docs/architecture/project-layout.md): where backend contexts, frontend code, database and tests live.
- [`docs/sql-database/data-model.md`](../../../docs/sql-database/data-model.md): schema/seed conventions (no migrations tool; re-apply with `npm run db:reset`).
- [`docs/testing/testing-strategy.md`](../../../docs/testing/testing-strategy.md): unit vs. integration test scope and commands.
- [`docs/architecture/screens.md`](../../../docs/architecture/screens.md): the `/` catalog and `/checkout` screens.

Existing code the feature builds on or parallels:

- Products context: [`src/contexts/backend/products/domain/Product.ts`](../../../src/contexts/backend/products/domain/Product.ts), [`ProductVariant.ts`](../../../src/contexts/backend/products/domain/ProductVariant.ts), [`ProductRepository.ts`](../../../src/contexts/backend/products/domain/ProductRepository.ts), [`application/ProductResponse.ts`](../../../src/contexts/backend/products/application/ProductResponse.ts), [`application/search/ProductsSearcher.ts`](../../../src/contexts/backend/products/application/search/ProductsSearcher.ts), [`infrastructure/PostgresProductRepository.ts`](../../../src/contexts/backend/products/infrastructure/PostgresProductRepository.ts).
- Checkout context: [`src/contexts/backend/checkout/domain/Checkout.ts`](../../../src/contexts/backend/checkout/domain/Checkout.ts), [`CheckoutLine.ts`](../../../src/contexts/backend/checkout/domain/CheckoutLine.ts), [`application/add/CartVariantAdder.ts`](../../../src/contexts/backend/checkout/application/add/CartVariantAdder.ts), [`application/view/CheckoutViewGetter.ts`](../../../src/contexts/backend/checkout/application/view/CheckoutViewGetter.ts), [`application/confirm/CheckoutConfirmer.ts`](../../../src/contexts/backend/checkout/application/confirm/CheckoutConfirmer.ts), [`infrastructure/PostgresCheckoutRepository.ts`](../../../src/contexts/backend/checkout/infrastructure/PostgresCheckoutRepository.ts).
- DI container: [`src/contexts/backend/shared/infrastructure/RetailContainer.ts`](../../../src/contexts/backend/shared/infrastructure/RetailContainer.ts).
- Frontend catalog: [`src/app/page.tsx`](../../../src/app/page.tsx), [`src/contexts/frontend/retail/sections/ProductCard.tsx`](../../../src/contexts/frontend/retail/sections/ProductCard.tsx), [`src/contexts/frontend/retail/ui/format.ts`](../../../src/contexts/frontend/retail/ui/format.ts).
- Checkout screen and actions: [`src/app/checkout/page.tsx`](../../../src/app/checkout/page.tsx), [`src/app/actions/checkout/addSelectedVariantToCart.ts`](../../../src/app/actions/checkout/addSelectedVariantToCart.ts), [`removeCartLine.ts`](../../../src/app/actions/checkout/removeCartLine.ts).
- Database: [`database/schema.sql`](../../../database/schema.sql), [`database/seed.sql`](../../../database/seed.sql).
- Test scaffolding: [`tests/shared/Mock.ts`](../../../tests/shared/Mock.ts), [`tests/backend/products/domain/ProductMother.ts`](../../../tests/backend/products/domain/ProductMother.ts), [`tests/backend/checkout/application/add/CartVariantAdder.spec.ts`](../../../tests/backend/checkout/application/add/CartVariantAdder.spec.ts).

Design decisions agreed with the user:

- Bundles live in a **new `bundles` bounded context**.
- A bundle in the cart is a **single line item** stored in a **new `checkout_bundle_lines` table** (keyed by `(checkout_id, bundle_id)`), leaving the existing variant lines untouched.
- Each bundle item points to **a specific product variant** (`variantId`), so add-to-cart and stock checks are deterministic.

## Phases

### Phase 1: Bundles visible in the catalog (read path)

**Description**: Create the `bundles` bounded context, its database tables and seed data, wire it into the DI container, and show bundles in the catalog next to individual products. This delivers a visible, navigable result early: the user can open `/` and see the seeded bundles with their discounted price and savings.

**Public contracts**

- Application services:
  - `BundlesSearcher.search(): Promise<BundleResponse[]>` (deps: `BundleRepository`, `ProductRepository`).
  - `toBundleResponse(bundle: Bundle, products: Product[]): BundleResponse`.
  - `BundleResponse = { id, name, description, price: MoneyPrimitives, originalPriceAmount: number, savingsAmount: number, items: { productId, variantId, productName, color, size }[] }`.
- Database schemas:
  - `bundles(id text pk, name text, description text, price_amount int, price_currency text default 'EUR')`.
  - `bundle_items(bundle_id text fk→bundles on delete cascade, product_id text fk→products on delete cascade, variant_id text fk→product_variants on delete cascade, primary key (bundle_id, variant_id))`.
- Text copies (catalog `BundleCard`): "Bundle", "Save {amount}", "Includes:".
- Test suites:
  - `tests/backend/bundles/application/search/BundlesSearcher.spec.ts`: returns enriched bundle responses with computed `originalPriceAmount`/`savingsAmount`; returns an empty list when there are no bundles.
  - `tests/backend/bundles/infrastructure/PostgresBundleRepository.spec.ts` (integration): persists and reads back a bundle with its items.

**To-do actions**

- [ ] Create `src/contexts/backend/bundles/domain/`: `BundleId.ts` (extends `StringValueObject`), `BundleItem.ts` (`productId`, `variantId`), `Bundle.ts` (`id`, `name`, `description`, `price: Money`, `items: BundleItem[]` with `fromPrimitives`/`toPrimitives`), `BundleRepository.ts` (abstract: `searchAll()`, `search(id)`).
- [ ] Create `src/contexts/backend/bundles/application/BundleResponse.ts` and `application/search/BundlesSearcher.ts` (enrich items and compute original price/savings from the products' variants).
- [ ] Create `src/contexts/backend/bundles/infrastructure/PostgresBundleRepository.ts` following `PostgresProductRepository` (reassemble bundle + items).
- [ ] Add `bundles` and `bundle_items` tables to `database/schema.sql` (mind drop ordering relative to products/checkout) and seed 2-3 default bundles in `database/seed.sql` referencing existing seeded variants, each with a discounted `price_amount` below the sum of its products.
- [ ] Register the repository and `get bundlesSearcher()` in `RetailContainer.ts`.
- [ ] Add `src/contexts/frontend/retail/sections/BundleCard.tsx` (name, discounted price, struck-through original price, savings, included items) and render bundles in `src/app/page.tsx` alongside product cards.
- [ ] Add `BundleMother` under `tests/backend/bundles/domain/` and write the unit + integration specs listed above.
- [ ] Run `npm run prep` to verify the changes in terms of typechecking and linting. Fix issues if any.
- [ ] STOP. Present the changes to the user for review and suggest commit messages. Do NOT proceed to the next phase until the user explicitly asks.

### Phase 2: Add bundle to cart as a single line item (write path)

**Description**: Let the customer add a bundle to the cart as one line item, see it in the checkout, remove it, and confirm an order that expands the bundle into its variants. Happy path only; validation and stock corner cases come in Phase 3.

**Public contracts**

- Application services:
  - `BundleToCartAdder.add(bundleId: string): Promise<void>` (deps: `CheckoutRepository`, `BundleRepository`, `CurrentUserProvider`).
  - `Checkout.addBundle(bundleId: string): Checkout`, `Checkout.removeBundle(bundleId: string): Checkout` (immutable, parallel to `addVariant`/`removeVariant`).
  - `CheckoutViewGetter.get()` `CheckoutResponse` extended with `bundleLines: { bundleId, name, quantity, priceAmount }[]`; `subtotalAmount` includes bundles.
  - `CheckoutConfirmer.confirm()` expands each bundle line into its variants as `PlaceOrderLine[]` at confirm time.
- Domain events / value objects:
  - `CheckoutBundleLine(bundleId: string, quantity: number)` with `withOneMore()` and primitives.
- Database schemas:
  - `checkout_bundle_lines(checkout_id text fk→checkouts on delete cascade, bundle_id text fk→bundles on delete cascade, quantity int, primary key (checkout_id, bundle_id))`.
- Text copies (checkout + card): "Add bundle to cart", bundle line label in the checkout summary.
- Test suites:
  - `tests/backend/checkout/application/add-bundle/BundleToCartAdder.spec.ts`: adds a bundle to a new checkout; increments quantity when the bundle is already present.
  - Update `tests/backend/checkout/application/view/CheckoutViewGetter.spec.ts` and `tests/backend/checkout/application/confirm/CheckoutConfirmer.spec.ts` to cover bundle lines.

**To-do actions**

- [ ] Add `src/contexts/backend/checkout/domain/CheckoutBundleLine.ts` and extend `Checkout` with `bundleLines`, `addBundle`, `removeBundle`, and updated `create`/`fromPrimitives`/`toPrimitives`/`itemCount`/`clear`.
- [ ] Create `src/contexts/backend/checkout/application/add-bundle/BundleToCartAdder.ts`.
- [ ] Extend `CheckoutViewGetter` and its `CheckoutResponse` to include bundle lines and add their price to the subtotal; expand bundles in `CheckoutConfirmer`.
- [ ] Add the `checkout_bundle_lines` table to `database/schema.sql` and update `PostgresCheckoutRepository` save/search (transaction) to persist and read bundle lines.
- [ ] Register `get bundleToCartAdder()` in `RetailContainer.ts`.
- [ ] Add `src/app/actions/checkout/addBundleToCart.ts` (`bundleToCartAdder.add`, `revalidatePath`, redirect to `/checkout`), an "Add bundle to cart" form on `BundleCard`, and render bundle lines with a remove form in `src/app/checkout/page.tsx` (reuse/extend `removeCartLine` for bundles).
- [ ] Write the new `BundleToCartAdder.spec.ts` and update the `CheckoutViewGetter`/`CheckoutConfirmer` specs.
- [ ] Run `npm run prep` to verify the changes in terms of typechecking and linting. Fix issues if any.
- [ ] STOP. Present the changes to the user for review and suggest commit messages. Do NOT proceed to the next phase until the user explicitly asks.

### Phase 3: Domain validation and corner cases

**Description**: Enforce the bundle invariants and handle add-to-cart failure paths so invalid bundles cannot exist and out-of-stock bundles cannot be added.

**Public contracts**

- Domain errors:
  - `BundleTooSmallError`: raised when a bundle has fewer than 2 items (enforced in `Bundle` construction).
  - `BundleNotDiscountedError`: raised when the bundle price is not lower than the sum of its products' prices.
  - `BundleNotFoundError`: raised by `BundleToCartAdder` when the bundle does not exist.
  - Reuse/parallel `VariantOutOfStockError` when any variant in the bundle lacks stock at add time.
- Test suites:
  - `tests/backend/bundles/domain/Bundle.spec.ts` (via a use case if applicable): rejects bundles with <2 items and non-discounted bundles.
  - Extend `tests/backend/checkout/application/add-bundle/BundleToCartAdder.spec.ts`: rejects a missing bundle and a bundle with an out-of-stock variant.

**To-do actions**

- [ ] Add `src/contexts/backend/bundles/domain/errors/BundleTooSmallError.ts` and `BundleNotDiscountedError.ts` (extend `CodelyError`) and enforce both invariants when constructing `Bundle`.
- [ ] Add `src/contexts/backend/checkout/domain/errors/BundleNotFoundError.ts` and validate bundle existence + per-variant stock in `BundleToCartAdder`.
- [ ] Add/extend the specs listed above for the invariants and the failing add-to-cart paths.
- [ ] Run `npm run prep` to verify the changes in terms of typechecking and linting. Fix issues if any.
- [ ] STOP. Present the changes to the user for review and suggest commit messages.

## Next step

Complete Phase 1 to make the seeded bundles visible in the catalog before wiring add-to-cart in Phase 2.

Plan to bundle up success by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)'s mascot).
