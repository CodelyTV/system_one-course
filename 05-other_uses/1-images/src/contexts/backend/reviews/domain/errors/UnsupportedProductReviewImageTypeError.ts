import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export class UnsupportedProductReviewImageTypeError extends CodelyError {
	constructor(supportedMediaTypes: string[]) {
		super(`Image must be one of: ${supportedMediaTypes.join(", ")}`);
	}
}
