import type { ProductRepository } from "@/contexts/backend/products/domain/ProductRepository";
import type { CurrentUserProvider } from "@/contexts/backend/users/domain/CurrentUserProvider";

import { Checkout } from "../../domain/Checkout";
import { checkoutIdForUser } from "../../domain/CheckoutId";
import type { CheckoutRepository } from "../../domain/CheckoutRepository";

export type CheckoutLineResponse = {
	variantId: string;
	productName: string;
	color: string;
	size: string;
	quantity: number;
	priceAmount: number;
};

export type CheckoutResponse = {
	status: string;
	subtotalAmount: number;
	lines: CheckoutLineResponse[];
};

export class CheckoutViewGetter {
	constructor(
		private readonly checkoutRepository: CheckoutRepository,
		private readonly productRepository: ProductRepository,
		private readonly currentUserProvider: CurrentUserProvider,
	) {}

	async get(): Promise<CheckoutResponse> {
		const checkoutId = checkoutIdForUser(
			await this.currentUserProvider.currentUserId(),
		);
		const [maybeCheckout, products] = await Promise.all([
			this.checkoutRepository.search(checkoutId),
			this.productRepository.searchAll(),
		]);
		const checkout = maybeCheckout ?? Checkout.create(checkoutId);

		const lines: CheckoutLineResponse[] = checkout.lines
			.flatMap((line) => {
				const product = products.find(
					(candidate) => candidate.id.value === line.productId,
				);
				const variant = product?.variant(line.variantId);

				if (!product || !variant) {
					return [];
				}

				return [
					{
						variantId: line.variantId,
						productName: product.name,
						color: variant.color,
						size: variant.size,
						quantity: line.quantity,
						priceAmount: product.price.amount,
					},
				];
			})
			.sort((a, b) => a.productName.localeCompare(b.productName));

		const subtotalAmount = lines.reduce(
			(total, line) => total + line.priceAmount * line.quantity,
			0,
		);

		return { status: checkout.status, subtotalAmount, lines };
	}
}
