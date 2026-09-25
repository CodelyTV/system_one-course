export type Size = "XS" | "S" | "M" | "L" | "XL";

export const sizeOrder: Size[] = ["XS", "S", "M", "L", "XL"];

export const lowStockThreshold = 2;

export type ProductVariantPrimitives = {
	id: string;
	color: string;
	colorHex: string;
	size: Size;
	onlineStock: number;
	measurements: { chest: number; length: number };
};

export class ProductVariant {
	constructor(
		readonly id: string,
		readonly color: string,
		readonly colorHex: string,
		readonly size: Size,
		readonly onlineStock: number,
		readonly measurements: { chest: number; length: number },
	) {}

	static fromPrimitives(
		primitives: ProductVariantPrimitives,
	): ProductVariant {
		return new ProductVariant(
			primitives.id,
			primitives.color,
			primitives.colorHex,
			primitives.size,
			primitives.onlineStock,
			primitives.measurements,
		);
	}

	hasStock(): boolean {
		return this.onlineStock > 0;
	}

	isLowStock(): boolean {
		return this.onlineStock <= lowStockThreshold;
	}

	toPrimitives(): ProductVariantPrimitives {
		return {
			id: this.id,
			color: this.color,
			colorHex: this.colorHex,
			size: this.size,
			onlineStock: this.onlineStock,
			measurements: this.measurements,
		};
	}
}
