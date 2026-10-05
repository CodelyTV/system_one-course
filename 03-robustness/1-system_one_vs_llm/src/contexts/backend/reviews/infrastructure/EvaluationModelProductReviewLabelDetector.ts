import {
	experimental_evaluate as evaluate,
	type Experimental_EvaluationModel as EvaluationModel,
} from "ai";

import type {ProductReview} from "../domain/ProductReview";
import {
	ProductReviewLabel,
	type ProductReviewLabelValue,
} from "../domain/ProductReviewLabel";
import {ProductReviewLabelDetector} from "../domain/ProductReviewLabelDetector";


export class EvaluationModelProductReviewLabelDetector extends ProductReviewLabelDetector {
	constructor(private readonly model: EvaluationModel) {
		super();
	}

	async detect(review: ProductReview): Promise<ProductReviewLabel> {
		const comment = review.comment.value;

		if (!comment) {
			return ProductReviewLabel.product();
		}

		const { answers } = await evaluate({
			model: this.model,
			state: { rating: review.rating.value, comment },
			questions: {
				label: {
					type: "choice",
					instructions:
						"What is the main topic of this product review?",
					criteria: {
						product:
							"The review is about the product itself: quality, fit, design, materials or durability.",
						shipping:
							"The review is about the delivery: shipping time, carrier or the state of the parcel on arrival.",
						packaging:
							"The review is about the packaging, the box or how the product was wrapped.",
						"customer-service":
							"The review is about the customer service: support, returns, refunds or communication with the store.",
						price: "The review is about the price or the value for money.",
						other: "The review is about none of the other topics.",
					} satisfies Record<ProductReviewLabelValue, string>,
				},
			},
		});

		console.log("🏷️ LABEL RESULT:", answers);

		return ProductReviewLabel.fromPrimitives(answers.label.choice);
	}
}
