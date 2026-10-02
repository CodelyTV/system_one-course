"use server";

import { revalidatePath } from "next/cache";

import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";
import { CodelyError } from "@/contexts/shared/domain/CodelyError";

export type CreateProductReviewState = {
	error: string | null;
};

export async function createProductReview(
	_previousState: CreateProductReviewState,
	formData: FormData,
): Promise<CreateProductReviewState> {
	const id = formData.get("id");
	const productId = formData.get("productId");
	const rating = formData.get("rating");
	const comment = formData.get("comment");

	if (typeof id !== "string" || id.length === 0) {
		throw new Error("id is required");
	}

	if (typeof productId !== "string" || productId.length === 0) {
		throw new Error("productId is required");
	}

	if (typeof rating !== "string" || rating.length === 0) {
		return { error: "Choose a rating from 1 to 5 stars" };
	}

	try {
		const userId =
			await retailContainer.currentUserProvider.currentUserId();

		await retailContainer.productReviewPublisher.create(
			id,
			productId,
			userId.value,
			Number(rating),
			typeof comment === "string" ? comment : null,
		);
	} catch (error) {
		if (error instanceof CodelyError) {
			return { error: error.message };
		}

		throw error;
	}

	revalidatePath(`/products/${productId}`);

	return { error: null };
}
