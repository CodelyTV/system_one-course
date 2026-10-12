import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export class ProductReviewImageTooLargeError extends CodelyError {
	constructor(maxSizeInBytes: number) {
		super(`Image must be at most ${maxSizeInBytes / (1024 * 1024)} MB`);
	}
}
