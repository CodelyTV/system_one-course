export const productReviewLabelValues = [
	"product",
	"shipping",
	"packaging",
	"customer-service",
	"price",
	"other",
] as const;

export type ProductReviewLabelValue = (typeof productReviewLabelValues)[number];

export class ProductReviewLabel {
	private constructor(readonly value: ProductReviewLabelValue) {}

	static product(): ProductReviewLabel {
		return new ProductReviewLabel("product");
	}

	static fromPrimitives(value: ProductReviewLabelValue): ProductReviewLabel {
		return new ProductReviewLabel(value);
	}
}
