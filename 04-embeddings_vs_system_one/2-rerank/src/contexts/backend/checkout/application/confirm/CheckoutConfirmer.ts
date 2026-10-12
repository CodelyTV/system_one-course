import type {
	OrderPlacer,
	PlaceOrderLine,
} from "@/contexts/backend/orders/application/place/OrderPlacer";
import type { ProductRepository } from "@/contexts/backend/products/domain/ProductRepository";
import type { CurrentUserProvider } from "@/contexts/backend/users/domain/CurrentUserProvider";

import { checkoutIdForUser } from "../../domain/CheckoutId";
import type { CheckoutRepository } from "../../domain/CheckoutRepository";

export class CheckoutConfirmer {
	constructor(
		private readonly checkoutRepository: CheckoutRepository,
		private readonly productRepository: ProductRepository,
		private readonly orderPlacer: OrderPlacer,
		private readonly currentUserProvider: CurrentUserProvider,
	) {}

	async confirm(): Promise<string | null> {
		const userId = await this.currentUserProvider.currentUserId();
		const checkout = await this.checkoutRepository.search(
			checkoutIdForUser(userId),
		);

		if (!checkout || checkout.isEmpty()) {
			return null;
		}

		const products = await this.productRepository.searchAll();

		const lines: PlaceOrderLine[] = checkout.lines.flatMap((line) => {
			const product = products.find(
				(candidate) => candidate.id.value === line.productId,
			);

			if (!product) {
				return [];
			}

			return [
				{
					productId: line.productId,
					variantId: line.variantId,
					quantity: line.quantity,
					unitPriceAmount: product.price.amount,
				},
			];
		});

		const orderId = await this.orderPlacer.place(
			userId.value,
			checkout.deliveryMethod,
			lines,
		);

		await this.checkoutRepository.save(checkout.clear());

		return orderId;
	}
}
