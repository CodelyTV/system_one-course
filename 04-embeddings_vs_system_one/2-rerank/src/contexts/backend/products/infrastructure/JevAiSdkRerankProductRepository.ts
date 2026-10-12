import {
	experimental_evaluate as evaluate,
	type Experimental_EvaluationModel as EvaluationModel,
} from "ai";

import type { Product } from "../domain/Product";
import type { ProductId } from "../domain/ProductId";
import type { ProductRepository } from "../domain/ProductRepository";

const relevanceLevels = [
	"Irrelevant: the product has nothing to do with the query.",
	"Slightly relevant: the product shares some traits with the query but is not what the customer is looking for.",
	"Relevant: the product is a good match for the query.",
	"Highly relevant: the product is exactly what the customer is looking for.",
];

const minimumRelevantLevel = 2;

type ScoredProduct = {
	product: Product;
	score: number;
};

export class JevAiSdkRerankProductRepository implements ProductRepository {
	constructor(
		private readonly repository: ProductRepository,
		private readonly model: EvaluationModel,
	) {}

	async save(product: Product): Promise<void> {
		await this.repository.save(product);
	}

	async searchAll(): Promise<Product[]> {
		return await this.repository.searchAll();
	}

	async search(id: ProductId): Promise<Product | null> {
		return await this.repository.search(id);
	}

	async searchByVariantId(variantId: string): Promise<Product | null> {
		return await this.repository.searchByVariantId(variantId);
	}

	async searchSimilar(query: string): Promise<Product[]> {
		const candidates = await this.repository.searchSimilar(query);

		const scoredProducts = await Promise.all(
			candidates.map((product) => this.score(query, product)),
		);

		const rankedProducts = scoredProducts.sort((a, b) => b.score - a.score);

		console.log(
			`🔎 RERANK RESULT for "${query}":`,
			rankedProducts.map(({ product, score }) => ({
				product: product.name,
				score,
			})),
		);

		return rankedProducts
			.filter(({ score }) => Math.round(score) >= minimumRelevantLevel)
			.map(({ product }) => product);
	}

	async searchCategories(): Promise<string[]> {
		return await this.repository.searchCategories();
	}

	private async score(
		query: string,
		product: Product,
	): Promise<ScoredProduct> {
		const { answers } = await evaluate({
			model: this.model,
			state: {
				query,
				product: {
					name: product.name,
					collection: product.collection,
					category: product.category,
					description: product.description,
					colors: product.colors().map((color) => color.name),
				},
			},
			questions: {
				relevance: {
					type: "score",
					instructions:
						"How relevant is this product for a customer who searched the catalog with this query?",
					criteria: relevanceLevels,
				},
			},
		});

		return { product, score: answers.relevance.score };
	}
}
