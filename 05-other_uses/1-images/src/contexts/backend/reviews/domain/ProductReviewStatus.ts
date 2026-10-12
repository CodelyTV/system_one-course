export type ProductReviewStatusValue =
	"pending-validation" | "published" | "spam";

export class ProductReviewStatus {
	private constructor(readonly value: ProductReviewStatusValue) {}

	static pendingValidation(): ProductReviewStatus {
		return new ProductReviewStatus("pending-validation");
	}

	static published(): ProductReviewStatus {
		return new ProductReviewStatus("published");
	}

	static spam(): ProductReviewStatus {
		return new ProductReviewStatus("spam");
	}

	static fromPrimitives(
		value: ProductReviewStatusValue,
	): ProductReviewStatus {
		return new ProductReviewStatus(value);
	}

	isPendingValidation(): boolean {
		return this.value === "pending-validation";
	}

	isPublished(): boolean {
		return this.value === "published";
	}

	isSpam(): boolean {
		return this.value === "spam";
	}
}
