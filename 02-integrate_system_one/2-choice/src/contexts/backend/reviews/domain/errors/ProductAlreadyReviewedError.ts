import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export class ProductAlreadyReviewedError extends CodelyError {
	constructor(productId: string) {
		super(`You already reviewed product ${productId}`);
	}
}
