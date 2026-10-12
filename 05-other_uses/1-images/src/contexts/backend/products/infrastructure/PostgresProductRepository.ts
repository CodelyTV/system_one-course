import { embed, type EmbeddingModel } from "ai";

import type { PostgresConnection } from "@/contexts/backend/shared/infrastructure/PostgresConnection";
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

const productColumns = [
	"id",
	"name",
	"collection",
	"category",
	"description",
	"price_amount",
	"price_currency",
	"badges",
	"accent",
];

const embeddingDimensions = 768;

const maxCosineDistance = 0.72;

export class PostgresProductRepository
	extends PostgresRepository
	implements ProductRepository
{
	constructor(
		connection: PostgresConnection,
		private readonly embeddingModel: EmbeddingModel,
	) {
		super(connection);
	}

	async save(product: Product): Promise<void> {
		const primitives = product.toPrimitives();
		const embedding = await this.generateEmbedding(
			this.serializeForEmbedding(product),
		);

		await this.sql.begin(async (sql) => {
			await sql`
				insert into products (id, name, collection, category, description, price_amount, price_currency, badges, accent, embedding)
				values (
					${primitives.id},
					${primitives.name},
					${primitives.collection},
					${primitives.category},
					${primitives.description},
					${primitives.price.amount},
					${primitives.price.currency},
					${primitives.badges},
					${primitives.accent},
					${embedding}
				)
				on conflict (id) do update set
					name = excluded.name,
					collection = excluded.collection,
					category = excluded.category,
					description = excluded.description,
					price_amount = excluded.price_amount,
					price_currency = excluded.price_currency,
					badges = excluded.badges,
					accent = excluded.accent,
					embedding = excluded.embedding
			`;

			if (primitives.variants.length > 0) {
				await sql`
					insert into product_variants ${sql(
						primitives.variants.map((variant) => ({
							id: variant.id,
							product_id: primitives.id,
							color: variant.color,
							color_hex: variant.colorHex,
							size: variant.size,
							online_stock: variant.onlineStock,
							chest: variant.measurements.chest,
							length: variant.measurements.length,
						})),
						"id",
						"product_id",
						"color",
						"color_hex",
						"size",
						"online_stock",
						"chest",
						"length",
					)}
					on conflict (id) do update set
						color = excluded.color,
						color_hex = excluded.color_hex,
						size = excluded.size,
						online_stock = excluded.online_stock,
						chest = excluded.chest,
						length = excluded.length
				`;
			}
		});
	}

	async searchAll(): Promise<Product[]> {
		const [productRows, variantRows] = await Promise.all([
			this.sql<ProductRow[]>`
				select ${this.sql(productColumns)}
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
				select ${this.sql(productColumns)}
				from products
				where id = ${id.value}
			`
		).at(0);

		if (!product) {
			return null;
		}

		const variantRows = await this.searchVariants([id.value]);

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

	async searchSimilar(query: string): Promise<Product[]> {
		const embedding = await this.generateEmbedding(query);

		const productRows = await this.sql<ProductRow[]>`
			select ${this.sql(productColumns)}
			from products
			where embedding <=> ${embedding}::vector <= ${maxCosineDistance}
			order by embedding <=> ${embedding}::vector
		`;

		const variantRows = await this.searchVariants(
			productRows.map((product) => product.id),
		);

		return productRows.map((product) =>
			this.toProduct(product, variantRows),
		);
	}

	async searchCategories(): Promise<string[]> {
		const rows = await this.sql<Array<{ category: string }>>`
			select distinct category
			from products
			order by category
		`;

		return rows.map((row) => row.category);
	}

	private async searchVariants(
		productIds: string[],
	): Promise<ProductVariantRow[]> {
		return await this.sql<ProductVariantRow[]>`
			select *
			from product_variants
			where product_id = any(${productIds}::text[])
			order by
				array_position(array['XS', 'S', 'M', 'L', 'XL'], size),
				color
		`;
	}

	private async generateEmbedding(value: string): Promise<string> {
		const { embedding } = await embed({
			model: this.embeddingModel,
			value,
			providerOptions: { openai: { dimensions: embeddingDimensions } },
		});

		return JSON.stringify(embedding);
	}

	private serializeForEmbedding(product: Product): string {
		return [
			`Name: ${product.name}`,
			`Collection: ${product.collection}`,
			`Category: ${product.category}`,
			`Description: ${product.description}`,
			`Colors: ${product
				.colors()
				.map((color) => color.name)
				.join(", ")}`,
		].join("|");
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
