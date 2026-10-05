import { expect, it } from "vitest";

import { Order } from "@/contexts/backend/orders/domain/Order";
import { OrderLine } from "@/contexts/backend/orders/domain/OrderLine";
import { PostgresOrderRepository } from "@/contexts/backend/orders/infrastructure/PostgresOrderRepository";
import { PostgresConnection } from "@/contexts/backend/shared/infrastructure/PostgresConnection";

import { describeWithEnvironmentArranger } from "../../shared/infrastructure/describeWithEnvironmentArranger";
import { RetailEnvironmentArranger } from "../../shared/infrastructure/RetailEnvironmentArranger";

const connection = new PostgresConnection();
const arranger = new RetailEnvironmentArranger(connection);
const repository = new PostgresOrderRepository(connection);

async function seedUserProductAndVariant(): Promise<void> {
	await connection.sql`
		insert into users (id, name, email)
		values ('user-aibuilder', 'AIBuilder', 'aibuilder@codely.com')
		on conflict (id) do nothing
	`;
	await connection.sql`
		insert into products (id, name, collection, category, description, price_amount, accent)
		values ('p1', 'Product', 'Collection', 'Category', 'Description', 50, 'green')
	`;
	await connection.sql`
		insert into product_variants (id, product_id, color, color_hex, size, online_stock, chest, length)
		values ('v1', 'p1', 'Black', '#000000', 'M', 5, 100, 70)
	`;
}

describeWithEnvironmentArranger(
	arranger,
	"PostgresOrderRepository should",
	() => {
		it("save an order and read it back", async () => {
			await seedUserProductAndVariant();
			const order = Order.place(
				"order-abcd1234",
				"user-aibuilder",
				new Date().toISOString(),
				"home-delivery",
				"EUR",
				[new OrderLine("p1", "v1", 2, 50)],
			);

			await repository.save(order);
			const found = await repository.search(order.id);

			const persisted = found?.toPrimitives();
			expect(persisted).toBeDefined();
			expect({ ...persisted, createdAt: undefined }).toEqual({
				...order.toPrimitives(),
				createdAt: undefined,
			});
			expect(typeof persisted?.createdAt).toBe("string");
		});

		it("list saved orders and count their items", async () => {
			await seedUserProductAndVariant();
			await repository.save(
				Order.place(
					"order-11112222",
					"user-aibuilder",
					new Date().toISOString(),
					"home-delivery",
					"EUR",
					[new OrderLine("p1", "v1", 3, 50)],
				),
			);

			const orders = await repository.searchAll();

			expect(orders).toHaveLength(1);
			expect(orders[0].items()).toBe(3);
			expect(orders[0].subtotal.amount).toBe(150);
		});

		it("list orders scoped to a user", async () => {
			await seedUserProductAndVariant();
			await connection.sql`
			insert into users (id, name, email)
			values ('user-other', 'Other User', 'other@codely.com')
		`;
			await repository.save(
				Order.place(
					"order-aaaa1111",
					"user-aibuilder",
					new Date().toISOString(),
					"home-delivery",
					"EUR",
					[new OrderLine("p1", "v1", 1, 50)],
				),
			);
			await repository.save(
				Order.place(
					"order-bbbb2222",
					"user-other",
					new Date().toISOString(),
					"home-delivery",
					"EUR",
					[new OrderLine("p1", "v1", 1, 50)],
				),
			);

			const orders = await repository.searchByUser("user-aibuilder");

			expect(orders).toHaveLength(1);
			expect(orders[0].id.value).toBe("order-aaaa1111");
		});
	},
);
