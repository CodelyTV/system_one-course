import type { ProductRepository } from "../../domain/ProductRepository";
import { type ProductResponse, toProductResponse } from "../ProductResponse";

export type ProductFilters = {
	collection?: string;
	category?: string;
};

export class ProductsSearcher {
	constructor(private readonly repository: ProductRepository) {}

	async search(filters: ProductFilters = {}): Promise<ProductResponse[]> {
		const products = await this.repository.searchAll();

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
