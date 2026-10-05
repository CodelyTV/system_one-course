import { describe, it } from "vitest";

import { ProductReviewValidator } from "@/contexts/backend/reviews/application/validate/ProductReviewValidator";
import { ValidateProductReviewOnProductReviewCreated } from "@/contexts/backend/reviews/application/validate/ValidateProductReviewOnProductReviewCreated";
import type { ProductReviewPrimitives } from "@/contexts/backend/reviews/domain/ProductReview";
import { ProductReviewCreatedDomainEvent } from "@/contexts/backend/reviews/domain/ProductReviewCreatedDomainEvent";
import type { ProductReviewRepository } from "@/contexts/backend/reviews/domain/ProductReviewRepository";
import type { ProductReviewSpamDetector } from "@/contexts/backend/reviews/domain/ProductReviewSpamDetector";

import { Mock } from "../../../../shared/Mock";
import { ProductReviewMother } from "../../domain/ProductReviewMother";

function createdEventFor(
	primitives: ProductReviewPrimitives,
): ProductReviewCreatedDomainEvent {
	return new ProductReviewCreatedDomainEvent(
		primitives.id,
		primitives.productId,
		primitives.userId,
		primitives.rating,
		primitives.comment,
	);
}

describe("ValidateProductReviewOnProductReviewCreated should", () => {
	const repository = Mock.create<ProductReviewRepository>();
	const spamDetector = Mock.create<ProductReviewSpamDetector>();
	const subscriber = new ValidateProductReviewOnProductReviewCreated(
		new ProductReviewValidator(repository, spamDetector),
	);

	it("publish a review that is not spam", async () => {
		const pending = ProductReviewMother.createPrimitives({
			status: "pending-validation",
		});
		repository.searchShouldReturn(ProductReviewMother.create(pending));
		spamDetector.isSpamShouldReturn(false);

		await subscriber.on(createdEventFor(pending));

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

		await subscriber.on(createdEventFor(pending));

		repository.expectSaveToHaveBeenCalledWith(
			ProductReviewMother.create({ ...pending, status: "spam" }),
		);
	});

	it("ignore a review that was already validated", async () => {
		const published = ProductReviewMother.createPrimitives({
			status: "published",
		});
		repository.searchShouldReturn(ProductReviewMother.create(published));

		await subscriber.on(createdEventFor(published));

		spamDetector.expectIsSpamNotToHaveBeenCalled();
		repository.expectSaveNotToHaveBeenCalled();
	});
});
