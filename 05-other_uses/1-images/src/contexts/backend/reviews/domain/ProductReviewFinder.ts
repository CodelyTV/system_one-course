import { ProductReviewDoesNotExistError } from "./errors/ProductReviewDoesNotExistError";
import type { ProductReview } from "./ProductReview";
import { ProductReviewId } from "./ProductReviewId";
import type { ProductReviewRepository } from "./ProductReviewRepository";

export class ProductReviewFinder {
	constructor(private readonly repository: ProductReviewRepository) {}

	async find(id: string): Promise<ProductReview> {
		const review = await this.repository.search(new ProductReviewId(id));

		if (!review) {
			throw new ProductReviewDoesNotExistError(id);
		}

		return review;
	}
}
