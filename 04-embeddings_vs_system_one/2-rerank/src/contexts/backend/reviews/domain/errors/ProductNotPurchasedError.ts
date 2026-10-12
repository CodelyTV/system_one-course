import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export class ProductNotPurchasedError extends CodelyError {
	constructor(productId: string) {
		super(`Only customers who bought product ${productId} can review it`);
	}
}
