import { PostgresRepository } from "@/contexts/backend/shared/infrastructure/PostgresRepository";

import { Checkout } from "../domain/Checkout";
import type { CheckoutId } from "../domain/CheckoutId";
import type { CheckoutRepository } from "../domain/CheckoutRepository";

type CheckoutRow = {
	id: string;
	delivery_method: string;
	status: string;
};

type CheckoutLineRow = {
	product_id: string;
	variant_id: string;
	quantity: number;
};

export class PostgresCheckoutRepository
	extends PostgresRepository
	implements CheckoutRepository
{
	async save(checkout: Checkout): Promise<void> {
		const primitives = checkout.toPrimitives();

		await this.sql.begin(async (sql) => {
			await sql`
				insert into checkouts (id, delivery_method, status)
				values (${primitives.id}, ${primitives.deliveryMethod}, ${primitives.status})
				on conflict (id) do update set
					delivery_method = excluded.delivery_method,
					status = excluded.status
			`;

			await sql`delete from checkout_lines where checkout_id = ${primitives.id}`;

			if (primitives.lines.length > 0) {
				await sql`
					insert into checkout_lines ${sql(
						primitives.lines.map((line) => ({
							checkout_id: primitives.id,
							product_id: line.productId,
							variant_id: line.variantId,
							quantity: line.quantity,
						})),
						"checkout_id",
						"product_id",
						"variant_id",
						"quantity",
					)}
				`;
			}
		});
	}

	async search(id: CheckoutId): Promise<Checkout | null> {
		const checkout = (
			await this.sql<CheckoutRow[]>`
				select id, delivery_method, status
				from checkouts
				where id = ${id.value}
			`
		).at(0);

		if (!checkout) {
			return null;
		}

		const lineRows = await this.sql<CheckoutLineRow[]>`
			select product_id, variant_id, quantity
			from checkout_lines
			where checkout_id = ${id.value}
		`;

		return Checkout.fromPrimitives({
			id: checkout.id,
			deliveryMethod: checkout.delivery_method,
			status: checkout.status,
			lines: lineRows.map((line) => ({
				productId: line.product_id,
				variantId: line.variant_id,
				quantity: line.quantity,
			})),
		});
	}
}
