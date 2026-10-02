import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export class ProductReviewNotPendingValidationError extends CodelyError {
	constructor(reviewId: string) {
		super(`Product review ${reviewId} is not pending validation`);
	}
}
