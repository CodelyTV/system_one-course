import {
	experimental_evaluate as evaluate,
	type Experimental_EvaluationModel as EvaluationModel,
} from "ai";

import type { ProductReview } from "../domain/ProductReview";
import { ProductReviewSpamDetector } from "../domain/ProductReviewSpamDetector";

const spamProbabilityThreshold = 0.5;

export class EvaluationModelProductReviewSpamDetector extends ProductReviewSpamDetector {
	constructor(private readonly model: EvaluationModel) {
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
					instructions:
						"Is this product review spam?",
				},
			},
		});

		return answers.isSpam.probability >= spamProbabilityThreshold;
	}
}
