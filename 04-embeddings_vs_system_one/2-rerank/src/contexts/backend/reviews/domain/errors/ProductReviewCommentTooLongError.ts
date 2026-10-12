import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export class ProductReviewCommentTooLongError extends CodelyError {
	constructor(maxLength: number) {
		super(`Comment must have at most ${maxLength} characters`);
	}
}
