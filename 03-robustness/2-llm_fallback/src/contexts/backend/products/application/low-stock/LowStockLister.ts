import type { ProductRepository } from "../../domain/ProductRepository";
import type { Size } from "../../domain/ProductVariant";

export type LowStockResponse = {
	productName: string;
	color: string;
	size: Size;
	stock: number;
};

export class LowStockLister {
	constructor(private readonly repository: ProductRepository) {}

	async list(): Promise<LowStockResponse[]> {
		const products = await this.repository.searchAll();

		const rows = products.flatMap((product) =>
			product.variants
				.filter((variant) => variant.isLowStock())
				.map((variant) => ({
					productName: product.name,
					color: variant.color,
					size: variant.size,
					stock: variant.onlineStock,
				})),
		);

		return rows.sort(
			(a, b) =>
				a.stock - b.stock || a.productName.localeCompare(b.productName),
		);
	}
}
