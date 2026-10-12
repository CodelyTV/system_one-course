import { InvalidProductReviewRatingError } from "./errors/InvalidProductReviewRatingError";

export class ProductReviewRating {
	static readonly min = 1;
	static readonly max = 5;

	constructor(readonly value: number) {
		if (
			!Number.isInteger(value) ||
			value < ProductReviewRating.min ||
			value > ProductReviewRating.max
		) {
			throw new InvalidProductReviewRatingError(value);
		}
	}
}
