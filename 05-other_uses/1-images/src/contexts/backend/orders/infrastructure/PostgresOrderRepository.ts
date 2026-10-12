import { PostgresRepository } from "@/contexts/backend/shared/infrastructure/PostgresRepository";
import type { Currency } from "@/contexts/shared/domain/Money";

import { Order } from "../domain/Order";
import type { OrderId } from "../domain/OrderId";
import type { OrderRepository } from "../domain/OrderRepository";

type OrderRow = {
	id: string;
	user_id: string;
	created_at: Date;
	status: string;
	delivery_method: string;
	subtotal_amount: number;
	currency: Currency;
};

type OrderLineRow = {
	order_id: string;
	product_id: string;
	variant_id: string;
	quantity: number;
	unit_price_amount: number;
};

export class PostgresOrderRepository
	extends PostgresRepository
	implements OrderRepository
{
	async save(order: Order): Promise<void> {
		const primitives = order.toPrimitives();

		await this.sql.begin(async (sql) => {
			await sql`
				insert into orders (id, user_id, delivery_method, subtotal_amount, currency, status)
				values (
					${primitives.id},
					${primitives.userId},
					${primitives.deliveryMethod},
					${primitives.subtotal.amount},
					${primitives.subtotal.currency},
					${primitives.status}
				)
			`;

			if (primitives.lines.length > 0) {
				await sql`
					insert into order_lines ${sql(
						primitives.lines.map((line) => ({
							order_id: primitives.id,
							product_id: line.productId,
							variant_id: line.variantId,
							quantity: line.quantity,
							unit_price_amount: line.unitPriceAmount,
						})),
						"order_id",
						"product_id",
						"variant_id",
						"quantity",
						"unit_price_amount",
					)}
				`;
			}
		});
	}

	async searchAll(): Promise<Order[]> {
		const [orderRows, lineRows] = await Promise.all([
			this.sql<OrderRow[]>`
				select id, user_id, created_at, status, delivery_method, subtotal_amount, currency
				from orders
				order by created_at desc
			`,
			this.sql<OrderLineRow[]>`
				select order_id, product_id, variant_id, quantity, unit_price_amount
				from order_lines
			`,
		]);

		return orderRows.map((order) => this.toOrder(order, lineRows));
	}

	async search(id: OrderId): Promise<Order | null> {
		const order = (
			await this.sql<OrderRow[]>`
				select id, user_id, created_at, status, delivery_method, subtotal_amount, currency
				from orders
				where id = ${id.value}
			`
		).at(0);

		if (!order) {
			return null;
		}

		const lineRows = await this.sql<OrderLineRow[]>`
			select order_id, product_id, variant_id, quantity, unit_price_amount
			from order_lines
			where order_id = ${id.value}
		`;

		return this.toOrder(order, lineRows);
	}

	async searchByUser(userId: string): Promise<Order[]> {
		const orderRows = await this.sql<OrderRow[]>`
			select id, user_id, created_at, status, delivery_method, subtotal_amount, currency
			from orders
			where user_id = ${userId}
			order by created_at desc
		`;

		const lineRows = await this.sql<OrderLineRow[]>`
			select order_id, product_id, variant_id, quantity, unit_price_amount
			from order_lines
			where order_id = any(${orderRows.map((order) => order.id)})
		`;

		return orderRows.map((order) => this.toOrder(order, lineRows));
	}

	private toOrder(order: OrderRow, lineRows: OrderLineRow[]): Order {
		return Order.fromPrimitives({
			id: order.id,
			userId: order.user_id,
			createdAt: order.created_at.toISOString(),
			deliveryMethod: order.delivery_method,
			status: order.status,
			subtotal: {
				amount: order.subtotal_amount,
				currency: order.currency,
			},
			lines: lineRows
				.filter((line) => line.order_id === order.id)
				.map((line) => ({
					productId: line.product_id,
					variantId: line.variant_id,
					quantity: line.quantity,
					unitPriceAmount: line.unit_price_amount,
				})),
		});
	}
}
