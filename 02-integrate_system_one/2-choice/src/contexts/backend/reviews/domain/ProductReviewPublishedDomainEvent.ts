import { DomainEvent } from "@/contexts/shared/domain/event/DomainEvent";

export type ProductReviewPublishedDomainEventPrimitives = {
	id: string;
	productId: string;
	userId: string;
	rating: number;
	comment: string | null;
};

export class ProductReviewPublishedDomainEvent extends DomainEvent {
	static readonly eventName = "codely.retail.product_review.published";

	constructor(
		readonly id: string,
		readonly productId: string,
		readonly userId: string,
		readonly rating: number,
		readonly comment: string | null,
		eventId?: string,
		occurredOn?: string,
	) {
		super(
			ProductReviewPublishedDomainEvent.eventName,
			id,
			eventId,
			occurredOn,
		);
	}

	toPrimitives(): ProductReviewPublishedDomainEventPrimitives {
		return {
			id: this.id,
			productId: this.productId,
			userId: this.userId,
			rating: this.rating,
			comment: this.comment,
		};
	}
}
