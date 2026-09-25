import type { CurrentUserProvider } from "@/contexts/backend/users/domain/CurrentUserProvider";

import { checkoutIdForUser } from "../../domain/CheckoutId";
import type { CheckoutRepository } from "../../domain/CheckoutRepository";

export class CartVariantRemover {
	constructor(
		private readonly checkoutRepository: CheckoutRepository,
		private readonly currentUserProvider: CurrentUserProvider,
	) {}

	async remove(variantId: string): Promise<void> {
		const checkoutId = checkoutIdForUser(
			await this.currentUserProvider.currentUserId(),
		);
		const checkout = await this.checkoutRepository.search(checkoutId);

		if (!checkout) {
			return;
		}

		await this.checkoutRepository.save(checkout.removeVariant(variantId));
	}
}
