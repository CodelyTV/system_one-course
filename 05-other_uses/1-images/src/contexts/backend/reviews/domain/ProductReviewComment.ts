import { ProductReviewCommentTooLongError } from "./errors/ProductReviewCommentTooLongError";

export class ProductReviewComment {
	static readonly maxLength = 1000;

	readonly value: string | null;

	constructor(value: string | null) {
		const trimmed = value?.trim() ?? "";

		if (trimmed.length > ProductReviewComment.maxLength) {
			throw new ProductReviewCommentTooLongError(
				ProductReviewComment.maxLength,
			);
		}

		this.value = trimmed.length > 0 ? trimmed : null;
	}
}
