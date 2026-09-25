import type { ProductRepository } from "@/contexts/backend/products/domain/ProductRepository";
import { UserId } from "@/contexts/backend/users/domain/UserId";
import type { UserRepository } from "@/contexts/backend/users/domain/UserRepository";

import { OrderId } from "../../domain/OrderId";
import type { OrderRepository } from "../../domain/OrderRepository";

export type OrderDetailLineResponse = {
	productName: string;
	color: string;
	size: string;
	quantity: number;
	unitPriceAmount: number;
};

export type OrderDetailResponse = {
	id: string;
	userId: string;
	customerName: string;
	createdAt: string;
	status: string;
	deliveryMethod: string;
	subtotalAmount: number;
	lines: OrderDetailLineResponse[];
};

export class OrderFinder {
	constructor(
		private readonly orderRepository: OrderRepository,
		private readonly productRepository: ProductRepository,
		private readonly userRepository: UserRepository,
	) {}

	async find(id: string): Promise<OrderDetailResponse | null> {
		const order = await this.orderRepository.search(new OrderId(id));

		if (!order) {
			return null;
		}

		const [products, customer] = await Promise.all([
			this.productRepository.searchAll(),
			this.userRepository.search(new UserId(order.userId)),
		]);

		const lines = order.lines
			.map((line) => {
				const product = products.find(
					(candidate) => candidate.id.value === line.productId,
				);
				const variant = product?.variant(line.variantId);

				return {
					productName: product?.name ?? line.productId,
					color: variant?.color ?? "",
					size: variant?.size ?? "",
					quantity: line.quantity,
					unitPriceAmount: line.unitPriceAmount,
				};
			})
			.sort((a, b) => a.productName.localeCompare(b.productName));

		return {
			id: order.id.value,
			userId: order.userId,
			customerName: customer?.name ?? order.userId,
			createdAt: order.createdAt,
			status: order.status,
			deliveryMethod: order.deliveryMethod,
			subtotalAmount: order.subtotal.amount,
			lines,
		};
	}
}
