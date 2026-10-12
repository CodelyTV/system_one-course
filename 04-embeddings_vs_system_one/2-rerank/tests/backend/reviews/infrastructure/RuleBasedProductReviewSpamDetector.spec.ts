import { describe, expect, it } from "vitest";

import { RuleBasedProductReviewSpamDetector } from "@/contexts/backend/reviews/infrastructure/RuleBasedProductReviewSpamDetector";

import { ProductReviewMother } from "../domain/ProductReviewMother";

describe("RuleBasedProductReviewSpamDetector should", () => {
	const detector = new RuleBasedProductReviewSpamDetector();

	it.each([
		"Check my shop at https://cheap-clothes.example",
		"Visit www.cheap-clothes.example now",
		"BUY NOW the best crypto deals",
		"Amazing!!!!!!!!!!!!",
	])("flag %s as spam", async (comment) => {
		expect(
			await detector.isSpam(ProductReviewMother.create({ comment })),
		).toBe(true);
	});

	it.each([
		"Great fit and the fabric feels premium.",
		"Runs a bit large, size down.",
		null,
	])("not flag %s as spam", async (comment) => {
		expect(
			await detector.isSpam(ProductReviewMother.create({ comment })),
		).toBe(false);
	});
});
