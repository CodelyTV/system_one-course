import type { ProductRepository } from "@/contexts/backend/products/domain/ProductRepository";
import type { CurrentUserProvider } from "@/contexts/backend/users/domain/CurrentUserProvider";

import { Checkout } from "../../domain/Checkout";
import { checkoutIdForUser } from "../../domain/CheckoutId";
import type { CheckoutRepository } from "../../domain/CheckoutRepository";
import { VariantNotFoundError } from "../../domain/errors/VariantNotFoundError";
import { VariantOutOfStockError } from "../../domain/errors/VariantOutOfStockError";

export class CartVariantAdder {
	constructor(
		private readonly checkoutRepository: CheckoutRepository,
		private readonly productRepository: ProductRepository,
		private readonly currentUserProvider: CurrentUserProvider,
	) {}

	async add(variantId: string): Promise<void> {
		const product =
			await this.productRepository.searchByVariantId(variantId);
		const variant = product?.variant(variantId);

		if (!product || !variant) {
			throw new VariantNotFoundError(variantId);
		}

		if (!variant.hasStock()) {
			throw new VariantOutOfStockError(variantId);
		}

		const checkoutId = checkoutIdForUser(
			await this.currentUserProvider.currentUserId(),
		);
		const checkout =
			(await this.checkoutRepository.search(checkoutId)) ??
			Checkout.create(checkoutId);

		await this.checkoutRepository.save(
			checkout.addVariant(product.id.value, variantId),
		);
	}
}
