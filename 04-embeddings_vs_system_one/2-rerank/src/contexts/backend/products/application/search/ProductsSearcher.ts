import type { ProductRepository } from "../../domain/ProductRepository";
import { type ProductResponse, toProductResponse } from "../ProductResponse";

export type ProductFilters = {
	query?: string;
	collection?: string;
	category?: string;
};

const similarProductsLimit = 6;

export class ProductsSearcher {
	constructor(private readonly repository: ProductRepository) {}

	async search(filters: ProductFilters = {}): Promise<ProductResponse[]> {
		const query = filters.query?.trim();
		const products = query
			? await this.repository.searchSimilar(query, similarProductsLimit)
			: await this.repository.searchAll();

		return products
			.filter(
				(product) =>
					!filters.collection ||
					product.collection === filters.collection,
			)
			.filter(
				(product) =>
					!filters.category || product.category === filters.category,
			)
			.map(toProductResponse);
	}
}
