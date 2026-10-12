import type { Checkout } from "./Checkout";
import type { CheckoutId } from "./CheckoutId";

export abstract class CheckoutRepository {
	abstract save(checkout: Checkout): Promise<void>;

	abstract search(id: CheckoutId): Promise<Checkout | null>;
}
