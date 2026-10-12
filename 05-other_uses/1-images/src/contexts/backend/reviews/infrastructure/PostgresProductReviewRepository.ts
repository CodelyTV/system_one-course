import { PostgresRepository } from "@/contexts/backend/shared/infrastructure/PostgresRepository";

import { ProductReview } from "../domain/ProductReview";
import type { ProductReviewId } from "../domain/ProductReviewId";
import type { ProductReviewLabelValue } from "../domain/ProductReviewLabel";
import type { ProductReviewRepository } from "../domain/ProductReviewRepository";
import type { ProductReviewStatusValue } from "../domain/ProductReviewStatus";

type ProductReviewRow = {
	id: string;
	product_id: string;
	user_id: string;
	rating: number;
	comment: string | null;
	image_media_type: string | null;
	image_data: Buffer | null;
	status: ProductReviewStatusValue;
	label: ProductReviewLabelValue | null;
	created_at: Date;
};

export class PostgresProductReviewRepository
	extends PostgresRepository
	implements ProductReviewRepository
{
	async save(review: ProductReview): Promise<void> {
		const primitives = review.toPrimitives();

		await this.sql`
			insert into product_reviews (id, product_id, user_id, rating, comment, image_media_type, image_data, status, label, created_at)
			values (
				${primitives.id},
				${primitives.productId},
				${primitives.userId},
				${primitives.rating},
				${primitives.comment},
				${primitives.image?.mediaType ?? null},
				${primitives.image ? Buffer.from(primitives.image.data, "base64") : null},
				${primitives.status},
				${primitives.label},
				${primitives.createdAt}
			)
			on conflict (id) do update set status = excluded.status, label = excluded.label
		`;
	}

	async search(id: ProductReviewId): Promise<ProductReview | null> {
		const row = (
			await this.sql<ProductReviewRow[]>`
				select id, product_id, user_id, rating, comment, image_media_type, image_data, status, label, created_at
				from product_reviews
				where id = ${id.value}
			`
		).at(0);

		return row ? this.toProductReview(row) : null;
	}

	async searchByProduct(productId: string): Promise<ProductReview[]> {
		const rows = await this.sql<ProductReviewRow[]>`
			select id, product_id, user_id, rating, comment, image_media_type, image_data, status, label, created_at
			from product_reviews
			where product_id = ${productId}
			order by created_at desc
		`;

		return rows.map((row) => this.toProductReview(row));
	}

	private toProductReview(row: ProductReviewRow): ProductReview {
		return ProductReview.fromPrimitives({
			id: row.id,
			productId: row.product_id,
			userId: row.user_id,
			rating: row.rating,
			comment: row.comment,
			image:
				row.image_media_type && row.image_data
					? {
							mediaType: row.image_media_type,
							data: row.image_data.toString("base64"),
						}
					: null,
			status: row.status,
			label: row.label,
			createdAt: row.created_at.toISOString(),
		});
	}
}
