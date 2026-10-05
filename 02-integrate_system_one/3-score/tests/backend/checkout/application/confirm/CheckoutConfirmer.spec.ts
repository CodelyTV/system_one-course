import { beforeEach, describe, expect, it } from "vitest";

import { CheckoutConfirmer } from "@/contexts/backend/checkout/application/confirm/CheckoutConfirmer";
import { Checkout } from "@/contexts/backend/checkout/domain/Checkout";
import { checkoutIdForUser } from "@/contexts/backend/checkout/domain/CheckoutId";
import type { CheckoutRepository } from "@/contexts/backend/checkout/domain/CheckoutRepository";
import type { OrderPlacer } from "@/contexts/backend/orders/application/place/OrderPlacer";
import type { ProductRepository } from "@/contexts/backend/products/domain/ProductRepository";
import type { CurrentUserProvider } from "@/contexts/backend/users/domain/CurrentUserProvider";
import { UserId } from "@/contexts/backend/users/domain/UserId";

import { Mock } from "../../../../shared/Mock";
import { ProductMother } from "../../../products/domain/ProductMother";
import { ProductVariantMother } from "../../../products/domain/ProductVariantMother";

describe("CheckoutConfirmer should", () => {
	const checkoutRepository = Mock.create<CheckoutRepository>();
	const productRepository = Mock.create<ProductRepository>();
	const orderPlacer = Mock.create<OrderPlacer>();
	const currentUserProvider = Mock.create<CurrentUserProvider>();
	const confirmer = new CheckoutConfirmer(
		checkoutRepository,
		productRepository,
		orderPlacer,
		currentUserProvider,
	);
	const userId = new UserId("user-aibuilder");
	const checkoutId = checkoutIdForUser(userId);

	beforeEach(() => {
		currentUserProvider.currentUserIdShouldReturn(userId);
	});

	it("place an order snapshotting current prices and empty the cart", async () => {
		const product = ProductMother.create({
			id: "p1",
			price: { amount: 50, currency: "EUR" },
			variants: [ProductVariantMother.createPrimitives({ id: "v1" })],
		});
		const checkout = Checkout.fromPrimitives({
			id: checkoutId.value,
			deliveryMethod: "home-delivery",
			status: "draft",
			lines: [{ productId: "p1", variantId: "v1", quantity: 2 }],
		});
		checkoutRepository.searchShouldReturn(checkout);
		productRepository.searchAllShouldReturn([product]);
		orderPlacer.placeShouldReturn("order-xyz");

		const orderId = await confirmer.confirm();

		expect(orderId).toBe("order-xyz");
		orderPlacer.expectPlaceToHaveBeenCalledWith(
			userId.value,
			"home-delivery",
			[
				{
					productId: "p1",
					variantId: "v1",
					quantity: 2,
					unitPriceAmount: 50,
				},
			],
		);
		checkoutRepository.expectSaveToHaveBeenCalledWith(checkout.clear());
	});

	it("return null and place no order when the cart is empty", async () => {
		checkoutRepository.searchShouldReturn(Checkout.create(checkoutId));

		expect(await confirmer.confirm()).toBeNull();
		orderPlacer.expectPlaceNotToHaveBeenCalled();
	});
});
