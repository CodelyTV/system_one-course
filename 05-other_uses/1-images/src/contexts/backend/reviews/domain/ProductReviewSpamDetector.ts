import type { ProductReview } from "./ProductReview";

export abstract class ProductReviewSpamDetector {
	abstract isSpam(review: ProductReview): Promise<boolean>;
}
