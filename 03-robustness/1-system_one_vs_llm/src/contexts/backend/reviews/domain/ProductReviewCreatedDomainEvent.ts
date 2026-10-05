import { DomainEvent } from "@/contexts/shared/domain/event/DomainEvent";

export type ProductReviewCreatedDomainEventPrimitives = {
	id: string;
	productId: string;
	userId: string;
	rating: number;
	comment: string | null;
};

export class ProductReviewCreatedDomainEvent extends DomainEvent {
	static readonly eventName = "codely.retail.product_review.created";

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
			ProductReviewCreatedDomainEvent.eventName,
			id,
			eventId,
			occurredOn,
		);
	}

	toPrimitives(): ProductReviewCreatedDomainEventPrimitives {
		return {
			id: this.id,
			productId: this.productId,
			userId: this.userId,
			rating: this.rating,
			comment: this.comment,
		};
	}
}
