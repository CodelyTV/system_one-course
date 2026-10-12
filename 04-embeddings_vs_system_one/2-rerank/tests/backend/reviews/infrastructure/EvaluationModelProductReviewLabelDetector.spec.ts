import { createGateway } from "ai";
import { describe, expect, it } from "vitest";

import { EvaluationModelProductReviewLabelDetector } from "@/contexts/backend/reviews/infrastructure/EvaluationModelProductReviewLabelDetector";

import { ProductReviewMother } from "../domain/ProductReviewMother";

const detector = new EvaluationModelProductReviewLabelDetector(
	createGateway({
		apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY,
	}).evaluationModel("typesafe-ai/jev"),
);

describe("EvaluationModelProductReviewLabelDetector should", () => {
	it("label a review about the delivery as shipping", async () => {
		const review = ProductReviewMother.create({
			rating: 2,
			comment:
				"It took three weeks to arrive and the carrier left it at the wrong door.",
		});

		expect((await detector.detect(review)).value).toBe("shipping");
	});

	it("label a review about the fabric as product", async () => {
		const review = ProductReviewMother.create({
			rating: 4,
			comment:
				"The fabric is thick and warm, but the sleeves are a bit long for me.",
		});

		expect((await detector.detect(review)).value).toBe("product");
	});

	it("label a review without comment as product", async () => {
		const review = ProductReviewMother.create({ comment: null });

		expect((await detector.detect(review)).value).toBe("product");
	});
});
