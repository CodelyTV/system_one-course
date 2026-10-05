import { ProductId } from "../../domain/ProductId";
import type { ProductRepository } from "../../domain/ProductRepository";
import { type ProductResponse, toProductResponse } from "../ProductResponse";

export class ProductFinder {
	constructor(private readonly repository: ProductRepository) {}

	async find(id: string): Promise<ProductResponse | null> {
		const product = await this.repository.search(new ProductId(id));

		return product ? toProductResponse(product) : null;
	}
}
