import { expect, it } from "vitest";

import { ProductReview } from "@/contexts/backend/reviews/domain/ProductReview";
import { ProductReviewLabel } from "@/contexts/backend/reviews/domain/ProductReviewLabel";
import { PostgresProductReviewRepository } from "@/contexts/backend/reviews/infrastructure/PostgresProductReviewRepository";
import { PostgresConnection } from "@/contexts/backend/shared/infrastructure/PostgresConnection";

import { describeWithEnvironmentArranger } from "../../shared/infrastructure/describeWithEnvironmentArranger";
import { RetailEnvironmentArranger } from "../../shared/infrastructure/RetailEnvironmentArranger";

const connection = new PostgresConnection();
const arranger = new RetailEnvironmentArranger(connection);
const repository = new PostgresProductReviewRepository(connection);

async function seedUsersAndProduct(): Promise<void> {
	await connection.sql`
		insert into users (id, name, email)
		values
			('user-aibuilder', 'AIBuilder', 'aibuilder@codely.com'),
			('user-other', 'Other User', 'other@codely.com')
	`;
	await connection.sql`
		insert into products (id, name, collection, category, description, price_amount, accent)
		values ('p1', 'Product', 'Collection', 'Category', 'Description', 50, 'green')
	`;
}

describeWithEnvironmentArranger(
	arranger,
	"PostgresProductReviewRepository should",
	() => {
		it("save a review and read it back", async () => {
			await seedUsersAndProduct();
			const review = ProductReview.create(
				"review-abcd1234",
				"p1",
				"user-aibuilder",
				5,
				"Great fit",
				new Date().toISOString(),
			);

			await repository.save(review);

			expect(
				(await repository.search(review.id))?.toPrimitives(),
			).toEqual(review.toPrimitives());
		});

		it("update the status of a validated review", async () => {
			await seedUsersAndProduct();
			const review = ProductReview.create(
				"review-abcd1234",
				"p1",
				"user-aibuilder",
				5,
				"Great fit",
				new Date().toISOString(),
			);
			await repository.save(review);

			review.publish();
			await repository.save(review);

			expect(
				(await repository.search(review.id))?.status.isPublished(),
			).toBe(true);
		});

		it("update the label of a published review", async () => {
			await seedUsersAndProduct();
			const review = ProductReview.create(
				"review-abcd1234",
				"p1",
				"user-aibuilder",
				2,
				"The box arrived crushed",
				new Date().toISOString(),
			);
			review.publish();
			await repository.save(review);

			review.labelAs(ProductReviewLabel.fromPrimitives("packaging"));
			await repository.save(review);

			expect((await repository.search(review.id))?.label?.value).toBe(
				"packaging",
			);
		});

		it("search the reviews of a product", async () => {
			await seedUsersAndProduct();
			await repository.save(
				ProductReview.create(
					"review-aaaa1111",
					"p1",
					"user-aibuilder",
					4,
					null,
					new Date().toISOString(),
				),
			);
			await repository.save(
				ProductReview.create(
					"review-bbbb2222",
					"p1",
					"user-other",
					2,
					"Not for me",
					new Date().toISOString(),
				),
			);

			const productReviews = await repository.searchByProduct("p1");

			expect(productReviews).toHaveLength(2);
		});

		it("save many reviews of the same customer for the same product", async () => {
			await seedUsersAndProduct();
			await repository.save(
				ProductReview.create(
					"review-cccc3333",
					"p1",
					"user-other",
					5,
					"Love it",
					new Date().toISOString(),
				),
			);
			await repository.save(
				ProductReview.create(
					"review-dddd4444",
					"p1",
					"user-other",
					3,
					"Shrank after washing",
					new Date().toISOString(),
				),
			);

			const productReviews = await repository.searchByProduct("p1");

			expect(productReviews.map((review) => review.id.value)).toEqual([
				"review-dddd4444",
				"review-cccc3333",
			]);
		});
	},
);
