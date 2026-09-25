import type { MoneyPrimitives } from "@/contexts/shared/domain/Money";

import type { Product, ProductAccent, ProductColor } from "../domain/Product";
import type { ProductVariantPrimitives } from "../domain/ProductVariant";

export type ProductResponse = {
	id: string;
	name: string;
	collection: string;
	category: string;
	description: string;
	price: MoneyPrimitives;
	badges: string[];
	accent: ProductAccent;
	variants: ProductVariantPrimitives[];
	colors: ProductColor[];
	totalOnlineStock: number;
	firstAvailableVariantId: string;
};

export function toProductResponse(product: Product): ProductResponse {
	return {
		...product.toPrimitives(),
		colors: product.colors(),
		totalOnlineStock: product.totalOnlineStock(),
		firstAvailableVariantId: product.firstAvailableVariant().id,
	};
}
