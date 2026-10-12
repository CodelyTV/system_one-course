import type { CurrentUserProvider } from "@/contexts/backend/users/domain/CurrentUserProvider";

import type { OrderRepository } from "../../domain/OrderRepository";

export type MyOrderResponse = {
	id: string;
	createdAt: string;
	status: string;
	deliveryMethod: string;
	subtotalAmount: number;
	items: number;
};

export class UserOrdersLister {
	constructor(
		private readonly repository: OrderRepository,
		private readonly currentUserProvider: CurrentUserProvider,
	) {}

	async list(): Promise<MyOrderResponse[]> {
		const userId = await this.currentUserProvider.currentUserId();
		const orders = await this.repository.searchByUser(userId.value);

		return orders.map((order) => ({
			id: order.id.value,
			createdAt: order.createdAt,
			status: order.status,
			deliveryMethod: order.deliveryMethod,
			subtotalAmount: order.subtotal.amount,
			items: order.items(),
		}));
	}
}
