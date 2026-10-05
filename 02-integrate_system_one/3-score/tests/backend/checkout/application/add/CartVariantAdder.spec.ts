import { beforeEach, describe, expect, it } from "vitest";

import { CartVariantAdder } from "@/contexts/backend/checkout/application/add/CartVariantAdder";
import { Checkout } from "@/contexts/backend/checkout/domain/Checkout";
import { checkoutIdForUser } from "@/contexts/backend/checkout/domain/CheckoutId";
import type { CheckoutRepository } from "@/contexts/backend/checkout/domain/CheckoutRepository";
import { VariantNotFoundError } from "@/contexts/backend/checkout/domain/errors/VariantNotFoundError";
import { VariantOutOfStockError } from "@/contexts/backend/checkout/domain/errors/VariantOutOfStockError";
import type { ProductRepository } from "@/contexts/backend/products/domain/ProductRepository";
import type { CurrentUserProvider } from "@/contexts/backend/users/domain/CurrentUserProvider";
import { UserId } from "@/contexts/backend/users/domain/UserId";

import { Mock } from "../../../../shared/Mock";
import { ProductMother } from "../../../products/domain/ProductMother";
import { ProductVariantMother } from "../../../products/domain/ProductVariantMother";

describe("CartVariantAdder should", () => {
	const checkoutRepository = Mock.create<CheckoutRepository>();
	const productRepository = Mock.create<ProductRepository>();
	const currentUserProvider = Mock.create<CurrentUserProvider>();
	const adder = new CartVariantAdder(
		checkoutRepository,
		productRepository,
		currentUserProvider,
	);
	const userId = new UserId("user-aibuilder");

	beforeEach(() => {
		currentUserProvider.currentUserIdShouldReturn(userId);
	});

	it("add an in-stock variant to a new cart", async () => {
		const product = ProductMother.create({
			variants: [
				ProductVariantMother.createPrimitives({
					id: "v1",
					onlineStock: 5,
				}),
			],
		});
		productRepository.searchByVariantIdShouldReturn(product);
		checkoutRepository.searchShouldReturn(null);

		await adder.add("v1");

		checkoutRepository.expectSaveToHaveBeenCalledWith(
			Checkout.create(checkoutIdForUser(userId)).addVariant(
				product.id.value,
				"v1",
			),
		);
	});

	it("fail when the variant is out of stock", async () => {
		const product = ProductMother.create({
			variants: [
				ProductVariantMother.createPrimitives({
					id: "v1",
					onlineStock: 0,
				}),
			],
		});
		productRepository.searchByVariantIdShouldReturn(product);

		await expect(adder.add("v1")).rejects.toBeInstanceOf(
			VariantOutOfStockError,
		);
		checkoutRepository.expectSaveNotToHaveBeenCalled();
	});

	it("fail when the variant does not exist", async () => {
		productRepository.searchByVariantIdShouldReturn(null);

		await expect(adder.add("ghost")).rejects.toBeInstanceOf(
			VariantNotFoundError,
		);
	});
});
