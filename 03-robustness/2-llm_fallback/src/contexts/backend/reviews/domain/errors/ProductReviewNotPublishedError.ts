import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export class ProductReviewNotPublishedError extends CodelyError {
	constructor(reviewId: string) {
		super(`Product review ${reviewId} is not published`);
	}
}
