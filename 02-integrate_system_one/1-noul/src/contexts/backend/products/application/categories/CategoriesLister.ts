import type { ProductRepository } from "../../domain/ProductRepository";

export class CategoriesLister {
	constructor(private readonly repository: ProductRepository) {}

	async list(): Promise<string[]> {
		return this.repository.searchCategories();
	}
}
