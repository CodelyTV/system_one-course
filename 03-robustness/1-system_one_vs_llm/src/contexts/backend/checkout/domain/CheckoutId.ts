import type { UserId } from "@/contexts/backend/users/domain/UserId";
import { StringValueObject } from "@/contexts/shared/domain/value-object/StringValueObject";

export class CheckoutId extends StringValueObject {}

export function checkoutIdForUser(userId: UserId): CheckoutId {
	return new CheckoutId(`checkout-${userId.value}`);
}
