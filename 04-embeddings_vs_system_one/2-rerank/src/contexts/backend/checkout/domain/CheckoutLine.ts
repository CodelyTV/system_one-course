export type CheckoutLinePrimitives = {
	productId: string;
	variantId: string;
	quantity: number;
};

export class CheckoutLine {
	constructor(
		readonly productId: string,
		readonly variantId: string,
		readonly quantity: number,
	) {}

	static fromPrimitives(primitives: CheckoutLinePrimitives): CheckoutLine {
		return new CheckoutLine(
			primitives.productId,
			primitives.variantId,
			primitives.quantity,
		);
	}

	withOneMore(): CheckoutLine {
		return new CheckoutLine(
			this.productId,
			this.variantId,
			this.quantity + 1,
		);
	}

	toPrimitives(): CheckoutLinePrimitives {
		return {
			productId: this.productId,
			variantId: this.variantId,
			quantity: this.quantity,
		};
	}
}
