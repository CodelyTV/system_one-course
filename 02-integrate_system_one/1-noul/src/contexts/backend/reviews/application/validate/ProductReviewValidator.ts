import { ProductReviewId } from "../../domain/ProductReviewId";
import type { ProductReviewRepository } from "../../domain/ProductReviewRepository";
import type { ProductReviewSpamDetector } from "../../domain/ProductReviewSpamDetector";

export class ProductReviewValidator {
	constructor(
		private readonly repository: ProductReviewRepository,
		private readonly spamDetector: ProductReviewSpamDetector,
	) {}

	async validate(id: string): Promise<void> {
		const review = await this.repository.search(new ProductReviewId(id));

		if (!review?.isPendingValidation()) {
			return;
		}

		if (await this.spamDetector.isSpam(review)) {
			review.markAsSpam();
		} else {
			review.publish();
		}

		await this.repository.save(review);
	}
}
