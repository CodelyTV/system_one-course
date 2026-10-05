import type { ProductReview } from "./ProductReview";
import type { ProductReviewId } from "./ProductReviewId";

export abstract class ProductReviewRepository {
	abstract save(review: ProductReview): Promise<void>;

	abstract search(id: ProductReviewId): Promise<ProductReview | null>;

	abstract searchByProduct(productId: string): Promise<ProductReview[]>;
}
