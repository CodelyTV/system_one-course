import type { Clock } from "@/contexts/shared/domain/Clock";
import type { EventBus } from "@/contexts/shared/domain/event/EventBus";

import { ProductReview } from "../../domain/ProductReview";
import type { ProductReviewRepository } from "../../domain/ProductReviewRepository";

export class ProductReviewPublisher {
	constructor(
		private readonly repository: ProductReviewRepository,
		private readonly clock: Clock,
		private readonly eventBus: EventBus,
	) {}

	async create(
		id: string,
		productId: string,
		userId: string,
		rating: number,
		comment: string | null,
	): Promise<void> {
		const review = ProductReview.create(
			id,
			productId,
			userId,
			rating,
			comment,
			this.clock.now(),
		);

		await this.repository.save(review);
		await this.eventBus.publish(review.pullDomainEvents());
	}
}
