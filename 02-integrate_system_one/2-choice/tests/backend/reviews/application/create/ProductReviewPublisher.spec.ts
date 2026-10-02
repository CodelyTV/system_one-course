import { beforeEach, describe, expect, it } from "vitest";

import { ProductReviewPublisher } from "@/contexts/backend/reviews/application/create/ProductReviewPublisher";
import { InvalidProductReviewRatingError } from "@/contexts/backend/reviews/domain/errors/InvalidProductReviewRatingError";
import { ProductReview } from "@/contexts/backend/reviews/domain/ProductReview";
import { ProductReviewPublishedDomainEvent } from "@/contexts/backend/reviews/domain/ProductReviewPublishedDomainEvent";
import type { ProductReviewRepository } from "@/contexts/backend/reviews/domain/ProductReviewRepository";
import type { Clock } from "@/contexts/shared/domain/Clock";
import type { EventBus } from "@/contexts/shared/domain/event/EventBus";

import { Mock } from "../../../../shared/Mock";

describe("ProductReviewPublisher should", () => {
	const repository = Mock.create<ProductReviewRepository>();
	const clock = Mock.create<Clock>();
	const eventBus = Mock.create<EventBus>();
	const publisher = new ProductReviewPublisher(repository, clock, eventBus);
	const now = "2026-10-02T10:00:00.000Z";

	beforeEach(() => {
		clock.nowShouldReturn(now);
	});

	it("save a review pending validation and publish that it was created", async () => {
		await publisher.create(
			"0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
			"p1",
			"user-aibuilder",
			4,
			"  Great fit  ",
		);

		repository.expectSaveToHaveBeenCalledWith(
			ProductReview.fromPrimitives({
				id: "0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
				productId: "p1",
				userId: "user-aibuilder",
				rating: 4,
				comment: "Great fit",
				status: "pending-validation",
				createdAt: now,
			}),
		);
		eventBus.expectPublishToHaveBeenCalledWith([
			new ProductReviewPublishedDomainEvent(
				"0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
				"p1",
				"user-aibuilder",
				4,
				"Great fit",
			),
		]);
	});

	it("fail when the rating is out of range", async () => {
		await expect(
			publisher.create(
				"0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
				"p1",
				"user-aibuilder",
				6,
				null,
			),
		).rejects.toBeInstanceOf(InvalidProductReviewRatingError);
		repository.expectSaveNotToHaveBeenCalled();
		eventBus.expectPublishNotToHaveBeenCalled();
	});
});
