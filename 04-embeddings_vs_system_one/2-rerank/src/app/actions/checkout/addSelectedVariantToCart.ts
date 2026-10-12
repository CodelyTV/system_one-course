"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";

export async function addSelectedVariantToCart(
	formData: FormData,
): Promise<void> {
	const variantId = formData.get("variantId");

	if (typeof variantId !== "string" || variantId.length === 0) {
		throw new Error("variantId is required");
	}

	await retailContainer.cartVariantAdder.add(variantId);
	revalidatePath("/", "layout");
	revalidatePath("/checkout");
	redirect("/checkout");
}
