import { generateText, type LanguageModel, Output } from "ai";

import type { ProductReview } from "../domain/ProductReview";
import { ProductReviewSpamDetector } from "../domain/ProductReviewSpamDetector";

export class LlmProductReviewSpamDetector extends ProductReviewSpamDetector {
	constructor(private readonly model: LanguageModel) {
		super();
	}

	async isSpam(review: ProductReview): Promise<boolean> {
		const comment = review.comment.value;

		if (!comment) {
			return false;
		}

		const { output } = await generateText({
			model: this.model,
			instructions: `You moderate product reviews of an online clothing store.
A review is spam when it does not give an opinion about the product: advertisements, links, promotions, scams, contact details, gibberish or unrelated content.
A negative, short or badly written opinion about the product is not spam.`,
			prompt: `Rating: ${review.rating.value}/5\nComment: ${comment}`,
			output: Output.choice({ options: ["spam", "not_spam"] }),
		});

		return output === "spam";
	}
}
