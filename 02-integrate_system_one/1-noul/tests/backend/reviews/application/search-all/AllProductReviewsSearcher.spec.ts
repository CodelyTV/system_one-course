import { beforeEach, describe, expect, it } from "vitest";

import { AllProductReviewsSearcher } from "@/contexts/backend/reviews/application/search-all/AllProductReviewsSearcher";
import type { ProductReviewRepository } from "@/contexts/backend/reviews/domain/ProductReviewRepository";
import type { CurrentUserProvider } from "@/contexts/backend/users/domain/CurrentUserProvider";
import { User } from "@/contexts/backend/users/domain/User";
import { UserId } from "@/contexts/backend/users/domain/UserId";
import type { UserRepository } from "@/contexts/backend/users/domain/UserRepository";

import { Mock } from "../../../../shared/Mock";
import { ProductReviewMother } from "../../domain/ProductReviewMother";

describe("AllProductReviewsSearcher should", () => {
	const repository = Mock.create<ProductReviewRepository>();
	const userRepository = Mock.create<UserRepository>();
	const currentUserProvider = Mock.create<CurrentUserProvider>();
	const searcher = new AllProductReviewsSearcher(
		repository,
		userRepository,
		currentUserProvider,
	);

	beforeEach(() => {
		currentUserProvider.currentUserIdShouldReturn(new UserId("user-me"));
		userRepository.searchAllShouldReturn([
			User.fromPrimitives({
				id: "user-other",
				name: "Other Customer",
				email: "other@codely.com",
			}),
		]);
	});

	it("show published reviews and my own review pending validation", async () => {
		const published = ProductReviewMother.create({
			id: "review-published",
			userId: "user-other",
			rating: 4,
			status: "published",
		});
		const myPending = ProductReviewMother.create({
			id: "review-mine",
			userId: "user-me",
			rating: 1,
			status: "pending-validation",
		});
		const othersPending = ProductReviewMother.create({
			id: "review-others-pending",
			userId: "user-other",
			status: "pending-validation",
		});
		const spam = ProductReviewMother.create({
			id: "review-spam",
			userId: "user-me",
			status: "spam",
		});
		repository.searchByProductShouldReturn([
			published,
			myPending,
			othersPending,
			spam,
		]);

		const result = await searcher.search("p1");

		expect(result.reviews.map((review) => review.id)).toEqual([
			"review-published",
			"review-mine",
		]);
		expect(result.reviews[0].authorName).toBe("Other Customer");
		expect(result.reviews[1].isPendingValidation).toBe(true);
	});

	it("compute the average rating from published reviews only", async () => {
		repository.searchByProductShouldReturn([
			ProductReviewMother.create({ rating: 5, status: "published" }),
			ProductReviewMother.create({ rating: 4, status: "published" }),
			ProductReviewMother.create({
				userId: "user-me",
				rating: 1,
				status: "pending-validation",
			}),
		]);

		const result = await searcher.search("p1");

		expect(result.averageRating).toBe(4.5);
		expect(result.total).toBe(2);
	});

	it("return no average rating when there are no published reviews", async () => {
		repository.searchByProductShouldReturn([]);

		const result = await searcher.search("p1");

		expect(result).toEqual({ averageRating: null, total: 0, reviews: [] });
	});
});
