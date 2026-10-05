import { PostgresRepository } from "@/contexts/backend/shared/infrastructure/PostgresRepository";

import { Product, type ProductAccent } from "../domain/Product";
import { ProductId } from "../domain/ProductId";
import type { ProductRepository } from "../domain/ProductRepository";
import type { Size } from "../domain/ProductVariant";

type ProductRow = {
	id: string;
	name: string;
	collection: string;
	category: string;
	description: string;
	price_amount: number;
	price_currency: "EUR";
	badges: string[];
	accent: ProductAccent;
};

type ProductVariantRow = {
	id: string;
	product_id: string;
	color: string;
	color_hex: string;
	size: Size;
	online_stock: number;
	chest: number;
	length: number;
};

export class PostgresProductRepository
	extends PostgresRepository
	implements ProductRepository
{
	async searchAll(): Promise<Product[]> {
		const [productRows, variantRows] = await Promise.all([
			this.sql<ProductRow[]>`
				select *
				from products
				order by collection, name
			`,
			this.sql<ProductVariantRow[]>`
				select *
				from product_variants
				order by
					product_id,
					array_position(array['XS', 'S', 'M', 'L', 'XL'], size),
					color
			`,
		]);

		return productRows.map((product) =>
			this.toProduct(product, variantRows),
		);
	}

	async search(id: ProductId): Promise<Product | null> {
		const product = (
			await this.sql<ProductRow[]>`
				select *
				from products
				where id = ${id.value}
			`
		).at(0);

		if (!product) {
			return null;
		}

		const variantRows = await this.sql<ProductVariantRow[]>`
			select *
			from product_variants
			where product_id = ${id.value}
			order by
				array_position(array['XS', 'S', 'M', 'L', 'XL'], size),
				color
		`;

		return this.toProduct(product, variantRows);
	}

	async searchByVariantId(variantId: string): Promise<Product | null> {
		const row = (
			await this.sql<Array<{ product_id: string }>>`
				select product_id
				from product_variants
				where id = ${variantId}
			`
		).at(0);

		if (!row) {
			return null;
		}

		return this.search(new ProductId(row.product_id));
	}

	async searchCategories(): Promise<string[]> {
		const rows = await this.sql<Array<{ category: string }>>`
			select distinct category
			from products
			order by category
		`;

		return rows.map((row) => row.category);
	}

	private toProduct(
		product: ProductRow,
		variantRows: ProductVariantRow[],
	): Product {
		return Product.fromPrimitives({
			id: product.id,
			name: product.name,
			collection: product.collection,
			category: product.category,
			description: product.description,
			price: {
				amount: product.price_amount,
				currency: product.price_currency,
			},
			badges: product.badges,
			accent: product.accent,
			variants: variantRows
				.filter((variant) => variant.product_id === product.id)
				.map((variant) => ({
					id: variant.id,
					color: variant.color,
					colorHex: variant.color_hex,
					size: variant.size,
					onlineStock: variant.online_stock,
					measurements: {
						chest: variant.chest,
						length: variant.length,
					},
				})),
		});
	}
}
