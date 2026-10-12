import type { ProductRepository } from "../../domain/ProductRepository";
import { type Size, sizeOrder } from "../../domain/ProductVariant";

export type InventoryResponse = {
	productName: string;
	collection: string;
	color: string;
	size: Size;
	stock: number;
	low: boolean;
};

export class InventoryLister {
	constructor(private readonly repository: ProductRepository) {}

	async list(): Promise<InventoryResponse[]> {
		const products = await this.repository.searchAll();

		const rows = products.flatMap((product) =>
			product.variants.map((variant) => ({
				productName: product.name,
				collection: product.collection,
				color: variant.color,
				size: variant.size,
				stock: variant.onlineStock,
				low: variant.isLowStock(),
			})),
		);

		return rows.sort(
			(a, b) =>
				a.stock - b.stock ||
				a.productName.localeCompare(b.productName) ||
				sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size),
		);
	}
}
