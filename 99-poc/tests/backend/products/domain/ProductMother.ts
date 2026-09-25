import { faker } from "@faker-js/faker";

import {
	Product,
	type ProductAccent,
	type ProductPrimitives,
} from "@/contexts/backend/products/domain/Product";

import { ProductVariantMother } from "./ProductVariantMother";

const accents: ProductAccent[] = ["green", "violet", "yellow", "pink"];

export class ProductMother {
	static create(overrides: Partial<ProductPrimitives> = {}): Product {
		return Product.fromPrimitives(
			ProductMother.createPrimitives(overrides),
		);
	}

	static createPrimitives(
		overrides: Partial<ProductPrimitives> = {},
	): ProductPrimitives {
		return {
			id: faker.helpers
				.slugify(faker.commerce.productName())
				.toLowerCase(),
			name: faker.commerce.productName(),
			collection: faker.commerce.department(),
			category: faker.commerce.department(),
			description: faker.commerce.productDescription(),
			price: {
				amount: faker.number.int({ min: 10, max: 200 }),
				currency: "EUR",
			},
			badges: [],
			accent: faker.helpers.arrayElement(accents),
			variants: [ProductVariantMother.createPrimitives()],
			...overrides,
		};
	}
}
