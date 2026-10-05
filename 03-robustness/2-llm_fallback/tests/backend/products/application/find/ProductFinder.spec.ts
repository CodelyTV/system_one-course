import { describe, expect, it } from "vitest";

import { ProductFinder } from "@/contexts/backend/products/application/find/ProductFinder";
import type { ProductRepository } from "@/contexts/backend/products/domain/ProductRepository";

import { Mock } from "../../../../shared/Mock";
import { ProductMother } from "../../domain/ProductMother";
import { ProductVariantMother } from "../../domain/ProductVariantMother";

describe("ProductFinder should", () => {
	const repository = Mock.create<ProductRepository>();
	const finder = new ProductFinder(repository);

	it("expose the first variant with stock as the initial variant", async () => {
		const product = ProductMother.create({
			variants: [
				ProductVariantMother.createPrimitives({
					id: "sold-out",
					onlineStock: 0,
				}),
				ProductVariantMother.createPrimitives({
					id: "available",
					onlineStock: 4,
				}),
			],
		});
		repository.searchShouldReturn(product);

		const result = await finder.find(product.id.value);

		expect(result?.firstAvailableVariantId).toBe("available");
	});

	it("return null when the product does not exist", async () => {
		repository.searchShouldReturn(null);

		expect(await finder.find("missing")).toBeNull();
	});
});
