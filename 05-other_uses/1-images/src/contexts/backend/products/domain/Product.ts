import { Money, type MoneyPrimitives } from "@/contexts/shared/domain/Money";

import { ProductId } from "./ProductId";
import {
	ProductVariant,
	type ProductVariantPrimitives,
} from "./ProductVariant";

export type ProductAccent = "green" | "violet" | "yellow" | "pink";

export type ProductColor = { name: string; hex: string };

export type ProductPrimitives = {
	id: string;
	name: string;
	collection: string;
	category: string;
	description: string;
	price: MoneyPrimitives;
	badges: string[];
	accent: ProductAccent;
	variants: ProductVariantPrimitives[];
};

export class Product {
	constructor(
		readonly id: ProductId,
		readonly name: string,
		readonly collection: string,
		readonly category: string,
		readonly description: string,
		readonly price: Money,
		readonly badges: string[],
		readonly accent: ProductAccent,
		readonly variants: ProductVariant[],
	) {}

	static fromPrimitives(primitives: ProductPrimitives): Product {
		return new Product(
			new ProductId(primitives.id),
			primitives.name,
			primitives.collection,
			primitives.category,
			primitives.description,
			Money.fromPrimitives(primitives.price),
			primitives.badges,
			primitives.accent,
			primitives.variants.map(ProductVariant.fromPrimitives),
		);
	}

	firstAvailableVariant(): ProductVariant {
		return (
			this.variants.find((variant) => variant.hasStock()) ??
			this.variants[0]
		);
	}

	variant(variantId: string): ProductVariant | undefined {
		return this.variants.find((variant) => variant.id === variantId);
	}

	colors(): ProductColor[] {
		const colors: ProductColor[] = [];

		for (const variant of this.variants) {
			if (!colors.some((color) => color.name === variant.color)) {
				colors.push({ name: variant.color, hex: variant.colorHex });
			}
		}

		return colors;
	}

	totalOnlineStock(): number {
		return this.variants.reduce(
			(total, variant) => total + variant.onlineStock,
			0,
		);
	}

	toPrimitives(): ProductPrimitives {
		return {
			id: this.id.value,
			name: this.name,
			collection: this.collection,
			category: this.category,
			description: this.description,
			price: this.price.toPrimitives(),
			badges: this.badges,
			accent: this.accent,
			variants: this.variants.map((variant) => variant.toPrimitives()),
		};
	}
}
