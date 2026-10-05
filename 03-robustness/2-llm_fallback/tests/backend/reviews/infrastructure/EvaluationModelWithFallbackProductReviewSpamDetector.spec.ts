import { createGateway } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductReviewSpamDetector } from "@/contexts/backend/reviews/domain/ProductReviewSpamDetector";
import { EvaluationModelWithFallbackProductReviewSpamDetector } from "@/contexts/backend/reviews/infrastructure/EvaluationModelWithFallbackProductReviewSpamDetector";

import { Mock } from "../../../shared/Mock";
import { ProductReviewMother } from "../domain/ProductReviewMother";

describe("EvaluationModelWithFallbackProductReviewSpamDetector should", () => {
	const fallback = Mock.create<ProductReviewSpamDetector>();
	const detector = new EvaluationModelWithFallbackProductReviewSpamDetector(
		createGateway({
			apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY,
		}).evaluationModel("typesafe-ai/jev"),
		fallback,
	);

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("flag an advertisement as spam without the fallback", async () => {
		const review = ProductReviewMother.create({
			rating: 5,
			comment:
				"Earn 5000€ a week working from home! Message me on WhatsApp +34 600 000 000",
		});

		expect(await detector.isSpam(review)).toBe(true);
		fallback.expectIsSpamNotToHaveBeenCalled();
	});

	it("not flag a genuine opinion about the product as spam without the fallback", async () => {
		const review = ProductReviewMother.create({
			rating: 4,
			comment:
				"The fabric is thick and warm, but the sleeves are a bit long for me.",
		});

		expect(await detector.isSpam(review)).toBe(false);
		fallback.expectIsSpamNotToHaveBeenCalled();
	});

	it("use the fallback answer when it is not confident enough", async () => {
		const review = ProductReviewMother.create({
			rating: 5,
			comment:
				"Fits perfectly. The cotton is soft and the colour did not fade after washing. Highly recommend! Also, my cousin's bakery in Valencia makes the best croissants, go visit Panadería Lola on Calle Mayor",
		});
		fallback.isSpamShouldReturn(true);

		expect(await detector.isSpam(review)).toBe(true);
		fallback.expectIsSpamToHaveBeenCalledWith(review);
	});

	it("not flag a review without comment as spam", async () => {
		const review = ProductReviewMother.create({ comment: null });

		expect(await detector.isSpam(review)).toBe(false);
		fallback.expectIsSpamNotToHaveBeenCalled();
	});
});
