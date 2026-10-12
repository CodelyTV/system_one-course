import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export class InvalidProductReviewRatingError extends CodelyError {
	constructor(rating: number) {
		super(`Rating ${rating} must be a whole number between 1 and 5`);
	}
}
