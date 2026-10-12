import { createGateway } from "ai";
import { describe, expect, it } from "vitest";

import type { ProductRepository } from "@/contexts/backend/products/domain/ProductRepository";
import { JevAiSdkRerankWithCutoffProductRepository } from "@/contexts/backend/products/infrastructure/JevAiSdkRerankWithCutoffProductRepository";

import { Mock } from "../../../shared/Mock";
import { ProductMother } from "../domain/ProductMother";

describe("JevAiSdkRerankWithCutoffProductRepository should", () => {
	const repository = Mock.create<ProductRepository>();
	const rerankRepository = new JevAiSdkRerankWithCutoffProductRepository(
		repository,
		createGateway({
			apiKey: process.env.AI_GATEWAY_API_KEY,
		}).evaluationModel("typesafe-ai/jev"),
	);

	it("keep only the relevant candidates", async () => {
		const jeans = ProductMother.create({
			name: "Merge Conflict Jeans",
			category: "Trousers",
			description:
				"Sturdy denim jeans with a straight cut. They resolve any conflict between comfort and style.",
		});
		const tee = ProductMother.create({
			name: "Domain Event Tee",
			category: "T-shirts",
			description:
				"Heavyweight cotton tee with a relaxed body. A solid staple, like a test that never fails.",
		});
		const hoodie = ProductMother.create({
			name: "Aggregate Hoodie",
			category: "Sweatshirts",
			description:
				"Hoodie with a brushed interior and a loose fit. The comfort of a deploy Friday where everything goes right.",
		});
		repository.searchSimilarShouldReturn([jeans, tee, hoodie]);

		const products = await rerankRepository.searchSimilar(
			"a warm hoodie for winter",
		);

		expect(products).toEqual([hoodie]);
	});
});
