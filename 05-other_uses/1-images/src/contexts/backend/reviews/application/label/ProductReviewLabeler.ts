import { ProductReviewFinder } from "../../domain/ProductReviewFinder";
import type { ProductReviewLabelDetector } from "../../domain/ProductReviewLabelDetector";
import type { ProductReviewRepository } from "../../domain/ProductReviewRepository";

export class ProductReviewLabeler {
	private readonly finder: ProductReviewFinder;

	constructor(
		private readonly repository: ProductReviewRepository,
		private readonly labelDetector: ProductReviewLabelDetector,
	) {
		this.finder = new ProductReviewFinder(repository);
	}

	async label(id: string): Promise<void> {
		const review = await this.finder.find(id);

		if (review.isLabeled()) {
			return;
		}

		review.labelAs(await this.labelDetector.detect(review));

		await this.repository.save(review);
	}
}
