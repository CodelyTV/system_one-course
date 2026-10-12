import { createGateway } from "ai";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductReviewImagePrimitives } from "@/contexts/backend/reviews/domain/ProductReviewImage";
import type { ProductReviewSpamDetector } from "@/contexts/backend/reviews/domain/ProductReviewSpamDetector";
import { EvaluationModelAiSdkWithFallbackProductReviewSpamDetector } from "@/contexts/backend/reviews/infrastructure/EvaluationModelAiSdkWithFallbackProductReviewSpamDetector";

import { Mock } from "../../../shared/Mock";
import { ProductReviewMother } from "../domain/ProductReviewMother";

function imageFixture(name: string): ProductReviewImagePrimitives {
	return {
		mediaType: "image/jpeg",
		data: readFileSync(join(__dirname, "images", name)).toString("base64"),
	};
}

describe("EvaluationModelWithFallbackProductReviewSpamDetector should", () => {
	const fallback = Mock.create<ProductReviewSpamDetector>();
	const detector = new EvaluationModelAiSdkWithFallbackProductReviewSpamDetector(
		createGateway({
			apiKey: process.env.AI_GATEWAY_API_KEY,
		}).decisionModel("openai/gpt-6-luna-decisions"),
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
			comment: "Love it. Check my profile for the full outfit.",
		});
		fallback.isSpamShouldReturn(true);

		expect(await detector.isSpam(review)).toBe(true);
		fallback.expectIsSpamToHaveBeenCalledWith(review);
	});

	it("not flag a genuine opinion with a photo of the product without the fallback", async () => {
		const review = ProductReviewMother.create({
			rating: 5,
			comment: "Great fit and the poplin feels premium.",
			image: imageFixture("idempotent-shirt.jpg"),
		});

		expect(await detector.isSpam(review)).toBe(false);
		fallback.expectIsSpamNotToHaveBeenCalled();
	});

	it("flag a genuine opinion with an advertisement image as spam without the fallback", async () => {
		const review = ProductReviewMother.create({
			rating: 5,
			comment: "Great fit and the poplin feels premium.",
			image: imageFixture("spam.jpg"),
		});

		expect(await detector.isSpam(review)).toBe(true);
		fallback.expectIsSpamNotToHaveBeenCalled();
	});

	it("flag a review without comment and with an image unrelated to the product as spam", async () => {
		const review = ProductReviewMother.create({
			rating: 4,
			comment: null,
			image: imageFixture("landscape.jpg"),
		});
		fallback.isSpamShouldReturn(true);

		expect(await detector.isSpam(review)).toBe(true);
	});

	it("not flag a review without comment and without image as spam", async () => {
		const review = ProductReviewMother.create({
			comment: null,
			image: null,
		});

		expect(await detector.isSpam(review)).toBe(false);
		fallback.expectIsSpamNotToHaveBeenCalled();
	});
});
