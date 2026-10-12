import { AggregateRoot } from "@/contexts/shared/domain/AggregateRoot";

import { ProductReviewNotPendingValidationError } from "./errors/ProductReviewNotPendingValidationError";
import { ProductReviewNotPublishedError } from "./errors/ProductReviewNotPublishedError";
import { ProductReviewComment } from "./ProductReviewComment";
import { ProductReviewCreatedDomainEvent } from "./ProductReviewCreatedDomainEvent";
import { ProductReviewId } from "./ProductReviewId";
import {
	ProductReviewLabel,
	type ProductReviewLabelValue,
} from "./ProductReviewLabel";
import { ProductReviewPublishedDomainEvent } from "./ProductReviewPublishedDomainEvent";
import { ProductReviewRating } from "./ProductReviewRating";
import {
	ProductReviewStatus,
	type ProductReviewStatusValue,
} from "./ProductReviewStatus";

export type ProductReviewPrimitives = {
	id: string;
	productId: string;
	userId: string;
	rating: number;
	comment: string | null;
	status: ProductReviewStatusValue;
	label: ProductReviewLabelValue | null;
	createdAt: string;
};

export class ProductReview extends AggregateRoot {
	constructor(
		readonly id: ProductReviewId,
		readonly productId: string,
		readonly userId: string,
		readonly rating: ProductReviewRating,
		readonly comment: ProductReviewComment,
		private reviewStatus: ProductReviewStatus,
		private reviewLabel: ProductReviewLabel | null,
		readonly createdAt: string,
	) {
		super();
	}

	static create(
		id: string,
		productId: string,
		userId: string,
		rating: number,
		comment: string | null,
		createdAt: string,
	): ProductReview {
		const review = new ProductReview(
			new ProductReviewId(id),
			productId,
			userId,
			new ProductReviewRating(rating),
			new ProductReviewComment(comment),
			ProductReviewStatus.pendingValidation(),
			null,
			createdAt,
		);

		review.record(
			new ProductReviewCreatedDomainEvent(
				review.id.value,
				review.productId,
				review.userId,
				review.rating.value,
				review.comment.value,
			),
		);

		return review;
	}

	static fromPrimitives(primitives: ProductReviewPrimitives): ProductReview {
		return new ProductReview(
			new ProductReviewId(primitives.id),
			primitives.productId,
			primitives.userId,
			new ProductReviewRating(primitives.rating),
			new ProductReviewComment(primitives.comment),
			ProductReviewStatus.fromPrimitives(primitives.status),
			primitives.label
				? ProductReviewLabel.fromPrimitives(primitives.label)
				: null,
			primitives.createdAt,
		);
	}

	get status(): ProductReviewStatus {
		return this.reviewStatus;
	}

	get label(): ProductReviewLabel | null {
		return this.reviewLabel;
	}

	isPendingValidation(): boolean {
		return this.reviewStatus.isPendingValidation();
	}

	isPublished(): boolean {
		return this.reviewStatus.isPublished();
	}

	isLabeled(): boolean {
		return this.reviewLabel !== null;
	}

	publish(): void {
		this.changeReviewStatusTo(ProductReviewStatus.published());

		this.record(new ProductReviewPublishedDomainEvent(this.id.value));
	}

	labelAs(label: ProductReviewLabel): void {
		this.ensureIsPublished();

		this.reviewLabel = label;
	}

	markAsSpam(): void {
		this.changeReviewStatusTo(ProductReviewStatus.spam());
	}

	toPrimitives(): ProductReviewPrimitives {
		return {
			id: this.id.value,
			productId: this.productId,
			userId: this.userId,
			rating: this.rating.value,
			comment: this.comment.value,
			status: this.reviewStatus.value,
			label: this.reviewLabel?.value ?? null,
			createdAt: this.createdAt,
		};
	}

	private changeReviewStatusTo(status: ProductReviewStatus): void {
		this.ensureIsPendingValidation();

		this.reviewStatus = status;
	}

	private ensureIsPendingValidation(): void {
		if (!this.isPendingValidation()) {
			throw new ProductReviewNotPendingValidationError(this.id.value);
		}
	}

	private ensureIsPublished(): void {
		if (!this.isPublished()) {
			throw new ProductReviewNotPublishedError(this.id.value);
		}
	}
}
