import { createGateway } from "ai";
import { describe, expect, it } from "vitest";

import { LlmProductReviewSpamDetector } from "@/contexts/backend/reviews/infrastructure/LlmProductReviewSpamDetector";

import { ProductReviewMother } from "../domain/ProductReviewMother";

const detector = new LlmProductReviewSpamDetector(
	createGateway({
		apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY,
	}).languageModel("openai/gpt-6-luna"),
);

describe("LlmProductReviewSpamDetector should", () => {
	it("flag an advertisement as spam", async () => {
		const review = ProductReviewMother.create({
			rating: 5,
			comment:
				"Earn 5000€ a week working from home! Message me on WhatsApp +34 600 000 000",
		});

		expect(await detector.isSpam(review)).toBe(true);
	});

	it("not flag a genuine opinion about the product as spam", async () => {
		const review = ProductReviewMother.create({
			rating: 4,
			comment:
				"The fabric is thick and warm, but the sleeves are a bit long for me.",
		});

		expect(await detector.isSpam(review)).toBe(false);
	});

	it("not flag a review without comment as spam", async () => {
		const review = ProductReviewMother.create({ comment: null });

		expect(await detector.isSpam(review)).toBe(false);
	});
});
