import type { Product } from "./Product";
import type { ProductId } from "./ProductId";

export abstract class ProductRepository {
	abstract searchAll(): Promise<Product[]>;

	abstract search(id: ProductId): Promise<Product | null>;

	abstract searchByVariantId(variantId: string): Promise<Product | null>;

	abstract searchCategories(): Promise<string[]>;
}
