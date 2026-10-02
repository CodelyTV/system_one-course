import { describe, it } from "vitest";

import { ProductReviewValidator } from "@/contexts/backend/reviews/application/validate/ProductReviewValidator";
import { ValidateProductReviewOnProductReviewPublished } from "@/contexts/backend/reviews/application/validate/ValidateProductReviewOnProductReviewPublished";
import type { ProductReviewPrimitives } from "@/contexts/backend/reviews/domain/ProductReview";
import { ProductReviewPublishedDomainEvent } from "@/contexts/backend/reviews/domain/ProductReviewPublishedDomainEvent";
import type { ProductReviewRepository } from "@/contexts/backend/reviews/domain/ProductReviewRepository";
import type { ProductReviewSpamDetector } from "@/contexts/backend/reviews/domain/ProductReviewSpamDetector";

import { Mock } from "../../../../shared/Mock";
import { ProductReviewMother } from "../../domain/ProductReviewMother";

function publishedEventFor(
	primitives: ProductReviewPrimitives,
): ProductReviewPublishedDomainEvent {
	return new ProductReviewPublishedDomainEvent(
		primitives.id,
		primitives.productId,
		primitives.userId,
		primitives.rating,
		primitives.comment,
	);
}

describe("ValidateProductReviewOnProductReviewPublished should", () => {
	const repository = Mock.create<ProductReviewRepository>();
	const spamDetector = Mock.create<ProductReviewSpamDetector>();
	const subscriber = new ValidateProductReviewOnProductReviewPublished(
		new ProductReviewValidator(repository, spamDetector),
	);

	it("publish a review that is not spam", async () => {
		const pending = ProductReviewMother.createPrimitives({
			status: "pending-validation",
		});
		repository.searchShouldReturn(ProductReviewMother.create(pending));
		spamDetector.isSpamShouldReturn(false);

		await subscriber.on(publishedEventFor(pending));

		repository.expectSaveToHaveBeenCalledWith(
			ProductReviewMother.create({ ...pending, status: "published" }),
		);
	});

	it("mark a review as spam when the detector flags it", async () => {
		const pending = ProductReviewMother.createPrimitives({
			status: "pending-validation",
		});
		repository.searchShouldReturn(ProductReviewMother.create(pending));
		spamDetector.isSpamShouldReturn(true);

		await subscriber.on(publishedEventFor(pending));

		repository.expectSaveToHaveBeenCalledWith(
			ProductReviewMother.create({ ...pending, status: "spam" }),
		);
	});

	it("ignore a review that was already validated", async () => {
		const published = ProductReviewMother.createPrimitives({
			status: "published",
		});
		repository.searchShouldReturn(ProductReviewMother.create(published));

		await subscriber.on(publishedEventFor(published));

		spamDetector.expectIsSpamNotToHaveBeenCalled();
		repository.expectSaveNotToHaveBeenCalled();
	});
});
