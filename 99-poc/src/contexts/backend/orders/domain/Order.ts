import {
	type Currency,
	Money,
	type MoneyPrimitives,
} from "@/contexts/shared/domain/Money";

import { OrderId } from "./OrderId";
import { OrderLine, type OrderLinePrimitives } from "./OrderLine";

export type OrderPrimitives = {
	id: string;
	userId: string;
	createdAt: string;
	deliveryMethod: string;
	status: string;
	subtotal: MoneyPrimitives;
	lines: OrderLinePrimitives[];
};

export class Order {
	constructor(
		readonly id: OrderId,
		readonly userId: string,
		readonly createdAt: string,
		readonly deliveryMethod: string,
		readonly status: string,
		readonly subtotal: Money,
		readonly lines: OrderLine[],
	) {}

	static place(
		id: string,
		userId: string,
		createdAt: string,
		deliveryMethod: string,
		currency: Currency,
		lines: OrderLine[],
	): Order {
		const subtotal = lines.reduce(
			(total, line) => total + line.lineTotal(),
			0,
		);

		return new Order(
			new OrderId(id),
			userId,
			createdAt,
			deliveryMethod,
			"confirmed",
			new Money(subtotal, currency),
			lines,
		);
	}

	static fromPrimitives(primitives: OrderPrimitives): Order {
		return new Order(
			new OrderId(primitives.id),
			primitives.userId,
			primitives.createdAt,
			primitives.deliveryMethod,
			primitives.status,
			Money.fromPrimitives(primitives.subtotal),
			primitives.lines.map(OrderLine.fromPrimitives),
		);
	}

	items(): number {
		return this.lines.reduce((total, line) => total + line.quantity, 0);
	}

	toPrimitives(): OrderPrimitives {
		return {
			id: this.id.value,
			userId: this.userId,
			createdAt: this.createdAt,
			deliveryMethod: this.deliveryMethod,
			status: this.status,
			subtotal: this.subtotal.toPrimitives(),
			lines: this.lines.map((line) => line.toPrimitives()),
		};
	}
}
