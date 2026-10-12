import { generateText, type LanguageModel, Output } from "ai";

import type { ProductReview } from "../domain/ProductReview";
import { ProductReviewSpamDetector } from "../domain/ProductReviewSpamDetector";

export class LlmProductReviewSpamDetector extends ProductReviewSpamDetector {
	constructor(private readonly model: LanguageModel) {
		super();
	}

	async isSpam(review: ProductReview): Promise<boolean> {
		const comment = review.comment.value;
		const image = review.image;

		if (!comment && !image) {
			return false;
		}

		const { output } = await generateText({
			model: this.model,
			instructions: `You moderate product reviews of an online clothing store.
A review is spam when it does not give an opinion about the product: advertisements, links, promotions, scams, contact details, gibberish or unrelated content.
A negative, short or badly written opinion about the product is not spam.
A review with an attached image is spam when the image is spam or is unrelated to the reviewed product. A photo of the garment, of someone wearing it, of its packaging or of a defect in it is related.`,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: `Rating: ${review.rating.value}/5\nComment: ${comment ?? "(no comment)"}`,
						},
						...(image
							? [
									{
										type: "file" as const,
										mediaType: image.mediaType,
										data: image.data,
									},
								]
							: []),
					],
				},
			],
			output: Output.choice({ options: ["spam", "not_spam"] }),
		});

		return output === "spam";
	}
}
