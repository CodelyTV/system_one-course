import { beforeEach, describe, expect, it } from "vitest";

import { ProductReviewCreator } from "@/contexts/backend/reviews/application/create/ProductReviewCreator";
import { InvalidProductReviewRatingError } from "@/contexts/backend/reviews/domain/errors/InvalidProductReviewRatingError";
import { ProductReviewImageTooLargeError } from "@/contexts/backend/reviews/domain/errors/ProductReviewImageTooLargeError";
import { UnsupportedProductReviewImageTypeError } from "@/contexts/backend/reviews/domain/errors/UnsupportedProductReviewImageTypeError";
import { ProductReview } from "@/contexts/backend/reviews/domain/ProductReview";
import { ProductReviewCreatedDomainEvent } from "@/contexts/backend/reviews/domain/ProductReviewCreatedDomainEvent";
import type { ProductReviewRepository } from "@/contexts/backend/reviews/domain/ProductReviewRepository";
import type { Clock } from "@/contexts/shared/domain/Clock";
import type { EventBus } from "@/contexts/shared/domain/event/EventBus";

import { Mock } from "../../../../shared/Mock";

describe("ProductReviewCreator should", () => {
	const repository = Mock.create<ProductReviewRepository>();
	const clock = Mock.create<Clock>();
	const eventBus = Mock.create<EventBus>();
	const creator = new ProductReviewCreator(repository, clock, eventBus);
	const now = "2026-10-02T10:00:00.000Z";

	beforeEach(() => {
		clock.nowShouldReturn(now);
	});

	it("save a review pending validation and publish that it was created", async () => {
		await creator.create(
			"0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
			"p1",
			"user-aibuilder",
			4,
			"  Great fit  ",
			null,
		);

		repository.expectSaveToHaveBeenCalledWith(
			ProductReview.fromPrimitives({
				id: "0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
				productId: "p1",
				userId: "user-aibuilder",
				rating: 4,
				comment: "Great fit",
				image: null,
				status: "pending-validation",
				label: null,
				createdAt: now,
			}),
		);
		eventBus.expectPublishToHaveBeenCalledWith([
			new ProductReviewCreatedDomainEvent(
				"0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
				"p1",
				"user-aibuilder",
				4,
				"Great fit",
			),
		]);
	});

	it("save a review with an image", async () => {
		const image = {
			mediaType: "image/jpeg",
			data: Buffer.from("fake image bytes").toString("base64"),
		};

		await creator.create(
			"0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
			"p1",
			"user-aibuilder",
			5,
			null,
			image,
		);

		repository.expectSaveToHaveBeenCalledWith(
			ProductReview.fromPrimitives({
				id: "0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
				productId: "p1",
				userId: "user-aibuilder",
				rating: 5,
				comment: null,
				image,
				status: "pending-validation",
				label: null,
				createdAt: now,
			}),
		);
	});

	it("fail when the image type is not supported", async () => {
		await expect(
			creator.create(
				"0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
				"p1",
				"user-aibuilder",
				5,
				null,
				{
					mediaType: "application/pdf",
					data: Buffer.from("fake pdf bytes").toString("base64"),
				},
			),
		).rejects.toBeInstanceOf(UnsupportedProductReviewImageTypeError);
		repository.expectSaveNotToHaveBeenCalled();
	});

	it("fail when the image is too large", async () => {
		await expect(
			creator.create(
				"0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
				"p1",
				"user-aibuilder",
				5,
				null,
				{
					mediaType: "image/png",
					data: Buffer.alloc(3 * 1024 * 1024).toString("base64"),
				},
			),
		).rejects.toBeInstanceOf(ProductReviewImageTooLargeError);
		repository.expectSaveNotToHaveBeenCalled();
	});

	it("fail when the rating is out of range", async () => {
		await expect(
			creator.create(
				"0b6f8c4e-6a43-4c55-9d1f-3f1f7c2a9e10",
				"p1",
				"user-aibuilder",
				6,
				null,
				null,
			),
		).rejects.toBeInstanceOf(InvalidProductReviewRatingError);
		repository.expectSaveNotToHaveBeenCalled();
		eventBus.expectPublishNotToHaveBeenCalled();
	});
});
