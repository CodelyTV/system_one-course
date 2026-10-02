"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";

export async function confirmOrder(): Promise<void> {
	const orderId = await retailContainer.checkoutConfirmer.confirm();
	revalidatePath("/", "layout");
	revalidatePath("/checkout");

	if (orderId) {
		redirect(`/checkout?order=${orderId}`);
	}
}
