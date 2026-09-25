import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export class VariantNotFoundError extends CodelyError {
	constructor(variantId: string) {
		super(`Variant ${variantId} not found`);
	}
}
