import { DomainEvent } from "@/contexts/shared/domain/event/DomainEvent";

export type ProductReviewPublishedDomainEventPrimitives = {
	id: string;
};

export class ProductReviewPublishedDomainEvent extends DomainEvent {
	static readonly eventName = "codely.retail.product_review.published";

	constructor(id: string, eventId?: string, occurredOn?: string) {
		super(
			ProductReviewPublishedDomainEvent.eventName,
			id,
			eventId,
			occurredOn,
		);
	}

	toPrimitives(): ProductReviewPublishedDomainEventPrimitives {
		return {
			id: this.aggregateId,
		};
	}
}
