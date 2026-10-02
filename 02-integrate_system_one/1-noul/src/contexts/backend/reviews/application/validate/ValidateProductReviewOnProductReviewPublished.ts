import type { DomainEventClass } from "@/contexts/shared/domain/event/DomainEvent";
import type { DomainEventSubscriber } from "@/contexts/shared/domain/event/DomainEventSubscriber";

import { ProductReviewPublishedDomainEvent } from "../../domain/ProductReviewPublishedDomainEvent";

import type { ProductReviewValidator } from "./ProductReviewValidator";

export class ValidateProductReviewOnProductReviewPublished implements DomainEventSubscriber<ProductReviewPublishedDomainEvent> {
	constructor(private readonly validator: ProductReviewValidator) {}

	subscribedTo(): DomainEventClass[] {
		return [ProductReviewPublishedDomainEvent];
	}

	async on(event: ProductReviewPublishedDomainEvent): Promise<void> {
		await this.validator.validate(event.aggregateId);
	}
}
