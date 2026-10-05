import type { DomainEventClass } from "@/contexts/shared/domain/event/DomainEvent";
import type { DomainEventSubscriber } from "@/contexts/shared/domain/event/DomainEventSubscriber";

import { ProductReviewCreatedDomainEvent } from "../../domain/ProductReviewCreatedDomainEvent";

import type { ProductReviewValidator } from "./ProductReviewValidator";

export class ValidateProductReviewOnProductReviewCreated implements DomainEventSubscriber<ProductReviewCreatedDomainEvent> {
	constructor(private readonly validator: ProductReviewValidator) {}

	subscribedTo(): DomainEventClass[] {
		return [ProductReviewCreatedDomainEvent];
	}

	async on(event: ProductReviewCreatedDomainEvent): Promise<void> {
		await this.validator.validate(event.aggregateId);
	}
}
