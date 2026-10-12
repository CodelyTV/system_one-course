import {
	experimental_decide as decide,
	type Experimental_DecisionModel as DecisionModel,
	type Experimental_DecisionState as DecisionState,
} from "ai";

import type { ProductReview } from "../domain/ProductReview";
import { ProductReviewSpamDetector } from "../domain/ProductReviewSpamDetector";

type BooleanQuestion = { type: "boolean"; instructions: string };

const spamProbabilityThreshold = { notSpam: 0.2, spam: 0.8 };

export class EvaluationModelAiSdkWithFallbackProductReviewSpamDetector extends ProductReviewSpamDetector {
	constructor(
		private readonly model: DecisionModel,
		private readonly fallback: ProductReviewSpamDetector,
	) {
		super();
	}

	async isSpam(review: ProductReview): Promise<boolean> {
		const comment = review.comment.value;
		const image = review.image;

		if (!comment && !image) {
			return false;
		}

		const questions: Record<string, BooleanQuestion> = {
			...(comment
				? {
						isSpam: {
							type: "boolean",
							instructions:
								"Is the comment of this product review spam?",
						},
					}
				: {}),
			...(image
				? {
						isImageSpam: {
							type: "boolean",
							instructions:
								"Is the image attached to this product review spam? Spam includes advertisements, promotions, links, QR codes, contact details, scams or offensive content.",
						},
						isImageUnrelatedToProduct: {
							type: "boolean",
							instructions:
								"Is the image attached to this review of an online clothing store unrelated to the reviewed product? A photo of the garment, of someone wearing it, of its packaging or of a defect in it is related.",
						},
					}
				: {}),
		};

		const { answers } = await decide({
			model: this.model,
			state: this.generateState(review),
			questions,
		});

		console.log("💬 SPAM RESULT:", answers);

		const spamProbability = Math.max(
			...Object.values(answers).map((answer) => answer.probability),
		);

		if (spamProbability <= spamProbabilityThreshold.notSpam) {
			return false;
		}

		if (spamProbability >= spamProbabilityThreshold.spam) {
			return true;
		}

		return this.fallback.isSpam(review);
	}

	private generateState(review: ProductReview): DecisionState {
		return [
			{
				type: "text",
				text: `Rating: ${review.rating.value}/5\nComment: ${review.comment.value ?? "(no comment)"}`,
			},
			...(review.image
				? [
						{
							type: "file" as const,
							mediaType: review.image.mediaType,
							data: review.image.data,
						},
					]
				: []),
		];
	}
}
