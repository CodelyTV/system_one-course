import { describe, expect, it } from "vitest";

import { LowStockLister } from "@/contexts/backend/products/application/low-stock/LowStockLister";
import type { ProductRepository } from "@/contexts/backend/products/domain/ProductRepository";

import { Mock } from "../../../../shared/Mock";
import { ProductMother } from "../../domain/ProductMother";
import { ProductVariantMother } from "../../domain/ProductVariantMother";

describe("LowStockLister should", () => {
	const repository = Mock.create<ProductRepository>();
	const lister = new LowStockLister(repository);

	it("return every variant at or below the threshold ordered by stock then name", async () => {
		const alfa = ProductMother.create({
			name: "Alfa",
			variants: [
				ProductVariantMother.createPrimitives({
					id: "a0",
					color: "Black",
					size: "M",
					onlineStock: 0,
				}),
				ProductVariantMother.createPrimitives({
					id: "a2",
					color: "Blue",
					size: "S",
					onlineStock: 2,
				}),
			],
		});
		const beta = ProductMother.create({
			name: "Beta",
			variants: [
				ProductVariantMother.createPrimitives({
					id: "b1",
					color: "Red",
					size: "L",
					onlineStock: 1,
				}),
				ProductVariantMother.createPrimitives({
					id: "bHigh",
					color: "Green",
					size: "XL",
					onlineStock: 9,
				}),
			],
		});
		repository.searchAllShouldReturn([alfa, beta]);

		expect(await lister.list()).toEqual([
			{ productName: "Alfa", color: "Black", size: "M", stock: 0 },
			{ productName: "Beta", color: "Red", size: "L", stock: 1 },
			{ productName: "Alfa", color: "Blue", size: "S", stock: 2 },
		]);
	});
});
