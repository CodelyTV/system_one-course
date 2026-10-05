import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export class ProductReviewDoesNotExistError extends CodelyError {
	constructor(reviewId: string) {
		super(`Product review ${reviewId} does not exist`);
	}
}
