# Product image credits

These images are **placeholders** for the demo storefront. Each file is named
after its product id (e.g. `hexagonal-overshirt.jpg`).

- Source: [Unsplash](https://unsplash.com) — used under the
  [Unsplash License](https://unsplash.com/license) (free to use, no attribution
  required).
- They are illustrative apparel photos, not real photography of these fictional
  products. Replace them with proper product shots for any non-demo use.

To refresh or swap an image, drop a new JPEG at
`public/products/<product-id>.jpg` (recommended ~900×1100, portrait).

## Cohesion rules (keep when adding products)

- Each photo must show a **single garment** (no racks or multi-garment flat-lays).
- The product's **default color** (first variant by size then color) must match the
  color shown in the photo. When adding a product, either pick a photo matching the
  default color, or set the default variant's `color`/`color_hex` in
  `database/seed.sql` to the color in the photo.
