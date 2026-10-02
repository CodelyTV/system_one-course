import { describe, expect, it, vi } from "vitest";

import { OrderPlacer } from "@/contexts/backend/orders/application/place/OrderPlacer";
import type { Order } from "@/contexts/backend/orders/domain/Order";
import type { OrderRepository } from "@/contexts/backend/orders/domain/OrderRepository";

import { Mock } from "../../../../shared/Mock";

describe("OrderPlacer should", () => {
	const repository = Mock.create<OrderRepository>();
	const placer = new OrderPlacer(repository);

	it("place a confirmed order with the subtotal computed from its lines", async () => {
		const orderId = await placer.place("user-aibuilder", "home-delivery", [
			{
				productId: "p1",
				variantId: "v1",
				quantity: 2,
				unitPriceAmount: 50,
			},
			{
				productId: "p2",
				variantId: "v2",
				quantity: 1,
				unitPriceAmount: 30,
			},
		]);

		expect(orderId).toMatch(/^order-[0-9a-f]{8}$/);

		const saved = (repository.save as unknown as ReturnType<typeof vi.fn>)
			.mock.calls[0][0] as Order;
		const primitives = saved.toPrimitives();

		expect(primitives.id).toBe(orderId);
		expect(primitives.userId).toBe("user-aibuilder");
		expect(primitives.status).toBe("confirmed");
		expect(primitives.deliveryMethod).toBe("home-delivery");
		expect(primitives.subtotal).toEqual({ amount: 130, currency: "EUR" });
		expect(primitives.lines).toEqual([
			{
				productId: "p1",
				variantId: "v1",
				quantity: 2,
				unitPriceAmount: 50,
			},
			{
				productId: "p2",
				variantId: "v2",
				quantity: 1,
				unitPriceAmount: 30,
			},
		]);
	});
});
