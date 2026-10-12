import type { DomainEventClass } from "@/contexts/shared/domain/event/DomainEvent";
import type { DomainEventSubscriber } from "@/contexts/shared/domain/event/DomainEventSubscriber";

import { ProductReviewPublishedDomainEvent } from "../../domain/ProductReviewPublishedDomainEvent";

import type { ProductReviewLabeler } from "./ProductReviewLabeler";

export class LabelProductReviewOnProductReviewPublished implements DomainEventSubscriber<ProductReviewPublishedDomainEvent> {
	constructor(private readonly labeler: ProductReviewLabeler) {}

	subscribedTo(): DomainEventClass[] {
		return [ProductReviewPublishedDomainEvent];
	}

	async on(event: ProductReviewPublishedDomainEvent): Promise<void> {
		await this.labeler.label(event.aggregateId);
	}
}
