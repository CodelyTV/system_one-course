import type { CurrentUserProvider } from "@/contexts/backend/users/domain/CurrentUserProvider";

import { checkoutIdForUser } from "../../domain/CheckoutId";
import type { CheckoutRepository } from "../../domain/CheckoutRepository";

export class CartItemCounter {
	constructor(
		private readonly checkoutRepository: CheckoutRepository,
		private readonly currentUserProvider: CurrentUserProvider,
	) {}

	async count(): Promise<number> {
		const checkoutId = checkoutIdForUser(
			await this.currentUserProvider.currentUserId(),
		);
		const checkout = await this.checkoutRepository.search(checkoutId);

		return checkout ? checkout.itemCount() : 0;
	}
}
