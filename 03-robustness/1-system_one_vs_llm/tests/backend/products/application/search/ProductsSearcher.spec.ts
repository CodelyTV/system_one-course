import { describe, expect, it } from "vitest";

import { toProductResponse } from "@/contexts/backend/products/application/ProductResponse";
import { ProductsSearcher } from "@/contexts/backend/products/application/search/ProductsSearcher";
import type { ProductRepository } from "@/contexts/backend/products/domain/ProductRepository";

import { Mock } from "../../../../shared/Mock";
import { ProductMother } from "../../domain/ProductMother";

describe("ProductsSearcher should", () => {
	const repository = Mock.create<ProductRepository>();
	const searcher = new ProductsSearcher(repository);

	it("return every product mapped to a response when no filter is given", async () => {
		const products = [ProductMother.create(), ProductMother.create()];
		repository.searchAllShouldReturn(products);

		expect(await searcher.search()).toEqual(
			products.map(toProductResponse),
		);
	});

	it("keep only the products of the requested collection and category", async () => {
		const wanted = ProductMother.create({
			collection: "Architecture Drop",
			category: "Camisetas",
		});
		const otherCollection = ProductMother.create({
			collection: "Core",
			category: "Camisetas",
		});
		const otherCategory = ProductMother.create({
			collection: "Architecture Drop",
			category: "Sudaderas",
		});
		repository.searchAllShouldReturn([
			wanted,
			otherCollection,
			otherCategory,
		]);

		expect(
			await searcher.search({
				collection: "Architecture Drop",
				category: "Camisetas",
			}),
		).toEqual([toProductResponse(wanted)]);
	});
});
