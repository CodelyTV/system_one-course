import type { ProductReview } from "./ProductReview";
import type { ProductReviewLabel } from "./ProductReviewLabel";

export abstract class ProductReviewLabelDetector {
	abstract detect(review: ProductReview): Promise<ProductReviewLabel>;
}
