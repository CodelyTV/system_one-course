import { expect, it } from "vitest";

import { ProductReview } from "@/contexts/backend/reviews/domain/ProductReview";
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

		it("search the reviews of a product and of a customer", async () => {
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
			const customerReview = await repository.searchByProductAndUser(
				"p1",
				"user-other",
			);

			expect(productReviews).toHaveLength(2);
			expect(customerReview?.id.value).toBe("review-bbbb2222");
			expect(
				await repository.searchByProductAndUser("p1", "user-missing"),
			).toBeNull();
		});
	},
);
