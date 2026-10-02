import { faker } from "@faker-js/faker";

import {
	ProductReview,
	type ProductReviewPrimitives,
} from "@/contexts/backend/reviews/domain/ProductReview";

export class ProductReviewMother {
	static create(
		overrides: Partial<ProductReviewPrimitives> = {},
	): ProductReview {
		return ProductReview.fromPrimitives(
			ProductReviewMother.createPrimitives(overrides),
		);
	}

	static createPrimitives(
		overrides: Partial<ProductReviewPrimitives> = {},
	): ProductReviewPrimitives {
		return {
			id: `review-${faker.string.hexadecimal({ length: 8, prefix: "", casing: "lower" })}`,
			productId: faker.helpers
				.slugify(faker.commerce.productName())
				.toLowerCase(),
			userId: `user-${faker.string.hexadecimal({ length: 8, prefix: "", casing: "lower" })}`,
			rating: faker.number.int({ min: 1, max: 5 }),
			comment: faker.lorem.sentence(),
			status: "published",
			createdAt: faker.date.recent().toISOString(),
			...overrides,
		};
	}
}
