import type { CurrentUserProvider } from "@/contexts/backend/users/domain/CurrentUserProvider";
import type { UserRepository } from "@/contexts/backend/users/domain/UserRepository";

import type { ProductReview } from "../../domain/ProductReview";
import type { ProductReviewRepository } from "../../domain/ProductReviewRepository";

export type ProductReviewResponse = {
	id: string;
	authorName: string;
	rating: number;
	comment: string | null;
	createdAt: string;
	isPendingValidation: boolean;
};

export type ProductReviewsResponse = {
	averageRating: number | null;
	total: number;
	reviews: ProductReviewResponse[];
};

export class AllProductReviewsSearcher {
	constructor(
		private readonly repository: ProductReviewRepository,
		private readonly userRepository: UserRepository,
		private readonly currentUserProvider: CurrentUserProvider,
	) {}

	async search(productId: string): Promise<ProductReviewsResponse> {
		const [reviews, users, currentUserId] = await Promise.all([
			this.repository.searchByProduct(productId),
			this.userRepository.searchAll(),
			this.currentUserProvider.currentUserId(),
		]);
		const nameByUserId = new Map(
			users.map((user) => [user.id.value, user.name]),
		);
		const published = reviews.filter((review) => review.isPublished());
		const visible = reviews.filter(
			(review) =>
				review.isPublished() ||
				(review.isPendingValidation() &&
					review.userId === currentUserId.value),
		);

		return {
			averageRating: this.averageRating(published),
			total: published.length,
			reviews: visible.map((review) => ({
				id: review.id.value,
				authorName: nameByUserId.get(review.userId) ?? review.userId,
				rating: review.rating.value,
				comment: review.comment.value,
				createdAt: review.createdAt,
				isPendingValidation: review.isPendingValidation(),
			})),
		};
	}

	private averageRating(reviews: ProductReview[]): number | null {
		if (reviews.length === 0) {
			return null;
		}

		const sum = reviews.reduce(
			(total, review) => total + review.rating.value,
			0,
		);

		return sum / reviews.length;
	}
}
