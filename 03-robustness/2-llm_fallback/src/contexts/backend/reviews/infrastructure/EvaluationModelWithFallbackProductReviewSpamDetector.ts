import {
	experimental_evaluate as evaluate,
	type Experimental_EvaluationModel as EvaluationModel,
} from "ai";

import type { ProductReview } from "../domain/ProductReview";
import { ProductReviewSpamDetector } from "../domain/ProductReviewSpamDetector";

const spamProbabilityThreshold = { notSpam: 0.3, spam: 0.7 };

export class EvaluationModelWithFallbackProductReviewSpamDetector extends ProductReviewSpamDetector {
	constructor(
		private readonly model: EvaluationModel,
		private readonly fallback: ProductReviewSpamDetector,
	) {
		super();
	}

	async isSpam(review: ProductReview): Promise<boolean> {
		const comment = review.comment.value;

		if (!comment) {
			return false;
		}

		const { answers } = await evaluate({
			model: this.model,
			state: { rating: review.rating.value, comment },
			questions: {
				isSpam: {
					type: "boolean",
					instructions: "Is this product review spam?",
				},
			},
		});

		const spamProbability = answers.isSpam.probability;

		if (spamProbability <= spamProbabilityThreshold.notSpam) {
			return false;
		}

		if (spamProbability >= spamProbabilityThreshold.spam) {
			return true;
		}

		return this.fallback.isSpam(review);
	}
}
