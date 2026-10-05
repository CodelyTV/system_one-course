import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export class VariantOutOfStockError extends CodelyError {
	constructor(variantId: string) {
		super(`Variant ${variantId} is out of stock`);
	}
}
