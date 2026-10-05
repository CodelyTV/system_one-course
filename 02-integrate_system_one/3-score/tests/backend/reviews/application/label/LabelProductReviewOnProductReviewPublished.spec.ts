import { describe, expect, it } from "vitest";

import { LabelProductReviewOnProductReviewPublished } from "@/contexts/backend/reviews/application/label/LabelProductReviewOnProductReviewPublished";
import { ProductReviewLabeler } from "@/contexts/backend/reviews/application/label/ProductReviewLabeler";
import { ProductReviewDoesNotExistError } from "@/contexts/backend/reviews/domain/errors/ProductReviewDoesNotExistError";
import type { ProductReviewPrimitives } from "@/contexts/backend/reviews/domain/ProductReview";
import { ProductReviewLabel } from "@/contexts/backend/reviews/domain/ProductReviewLabel";
import type { ProductReviewLabelDetector } from "@/contexts/backend/reviews/domain/ProductReviewLabelDetector";
import { ProductReviewPublishedDomainEvent } from "@/contexts/backend/reviews/domain/ProductReviewPublishedDomainEvent";
import type { ProductReviewRepository } from "@/contexts/backend/reviews/domain/ProductReviewRepository";

import { Mock } from "../../../../shared/Mock";
import { ProductReviewMother } from "../../domain/ProductReviewMother";

function publishedEventFor(
	primitives: ProductReviewPrimitives,
): ProductReviewPublishedDomainEvent {
	return new ProductReviewPublishedDomainEvent(primitives.id);
}

describe("LabelProductReviewOnProductReviewPublished should", () => {
	const repository = Mock.create<ProductReviewRepository>();
	const labelDetector = Mock.create<ProductReviewLabelDetector>();
	const subscriber = new LabelProductReviewOnProductReviewPublished(
		new ProductReviewLabeler(repository, labelDetector),
	);

	it("label a published review with the topic of its comment", async () => {
		const published = ProductReviewMother.createPrimitives({
			status: "published",
			label: null,
		});
		repository.searchShouldReturn(ProductReviewMother.create(published));
		labelDetector.detectShouldReturn(
			ProductReviewLabel.fromPrimitives("shipping"),
		);

		await subscriber.on(publishedEventFor(published));

		repository.expectSaveToHaveBeenCalledWith(
			ProductReviewMother.create({ ...published, label: "shipping" }),
		);
	});

	it("ignore a review that was already labeled", async () => {
		const labeled = ProductReviewMother.createPrimitives({
			status: "published",
			label: "price",
		});
		repository.searchShouldReturn(ProductReviewMother.create(labeled));

		await subscriber.on(publishedEventFor(labeled));

		labelDetector.expectDetectNotToHaveBeenCalled();
		repository.expectSaveNotToHaveBeenCalled();
	});

	it("fail when the review does not exist", async () => {
		const missing = ProductReviewMother.createPrimitives();
		repository.searchShouldReturn(null);

		await expect(
			subscriber.on(publishedEventFor(missing)),
		).rejects.toBeInstanceOf(ProductReviewDoesNotExistError);
		labelDetector.expectDetectNotToHaveBeenCalled();
		repository.expectSaveNotToHaveBeenCalled();
	});
});
