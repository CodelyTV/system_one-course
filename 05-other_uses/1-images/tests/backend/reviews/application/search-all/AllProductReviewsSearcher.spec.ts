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

	it("show published reviews and all my own reviews", async () => {
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
		const othersSpam = ProductReviewMother.create({
			id: "review-others-spam",
			userId: "user-other",
			status: "spam",
		});
		const mySpam = ProductReviewMother.create({
			id: "review-my-spam",
			userId: "user-me",
			status: "spam",
		});
		repository.searchByProductShouldReturn([
			published,
			myPending,
			othersPending,
			othersSpam,
			mySpam,
		]);

		const result = await searcher.search("p1");

		expect(result.reviews.map((review) => review.id)).toEqual([
			"review-published",
			"review-mine",
			"review-my-spam",
		]);
		expect(result.reviews[0].authorName).toBe("Other Customer");
	});

	it("expose the status only of my own reviews", async () => {
		repository.searchByProductShouldReturn([
			ProductReviewMother.create({
				id: "review-others-published",
				userId: "user-other",
				status: "published",
			}),
			ProductReviewMother.create({
				id: "review-my-published",
				userId: "user-me",
				status: "published",
			}),
			ProductReviewMother.create({
				id: "review-my-pending",
				userId: "user-me",
				status: "pending-validation",
			}),
			ProductReviewMother.create({
				id: "review-my-spam",
				userId: "user-me",
				status: "spam",
			}),
		]);

		const result = await searcher.search("p1");

		expect(result.reviews.map((review) => review.ownStatus)).toEqual([
			null,
			"published",
			"pending-validation",
			"spam",
		]);
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
