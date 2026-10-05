import type { ProductReview } from "../domain/ProductReview";
import { ProductReviewSpamDetector } from "../domain/ProductReviewSpamDetector";

const blocklistedTerms = [
	"buy now",
	"click here",
	"free money",
	"crypto",
	"casino",
	"discount code",
	"work from home",
	"viagra",
];

const linkPattern = /(https?:\/\/|www\.)\S+/i;
const repeatedCharacterPattern = /(.)\1{7,}/;

export class RuleBasedProductReviewSpamDetector extends ProductReviewSpamDetector {
	async isSpam(review: ProductReview): Promise<boolean> {
		const comment = review.comment.value;

		if (!comment) {
			return false;
		}

		const normalized = comment.toLowerCase();

		return (
			linkPattern.test(comment) ||
			repeatedCharacterPattern.test(comment) ||
			blocklistedTerms.some((term) => normalized.includes(term))
		);
	}
}
