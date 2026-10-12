"use server";

import { revalidatePath } from "next/cache";

import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";

export async function removeCartLine(formData: FormData): Promise<void> {
	const variantId = formData.get("variantId");

	if (typeof variantId !== "string" || variantId.length === 0) {
		throw new Error("variantId is required");
	}

	await retailContainer.cartVariantRemover.remove(variantId);
	revalidatePath("/", "layout");
	revalidatePath("/checkout");
}
