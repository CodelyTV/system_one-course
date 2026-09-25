import { CheckoutId } from "./CheckoutId";
import { CheckoutLine, type CheckoutLinePrimitives } from "./CheckoutLine";

export type CheckoutPrimitives = {
	id: string;
	deliveryMethod: string;
	status: string;
	lines: CheckoutLinePrimitives[];
};

export class Checkout {
	constructor(
		readonly id: CheckoutId,
		readonly deliveryMethod: string,
		readonly status: string,
		readonly lines: CheckoutLine[],
	) {}

	static create(id: CheckoutId): Checkout {
		return new Checkout(id, "home-delivery", "draft", []);
	}

	static fromPrimitives(primitives: CheckoutPrimitives): Checkout {
		return new Checkout(
			new CheckoutId(primitives.id),
			primitives.deliveryMethod,
			primitives.status,
			primitives.lines.map(CheckoutLine.fromPrimitives),
		);
	}

	addVariant(productId: string, variantId: string): Checkout {
		const alreadyInCart = this.lines.some(
			(line) => line.variantId === variantId,
		);

		const lines = alreadyInCart
			? this.lines.map((line) =>
					line.variantId === variantId ? line.withOneMore() : line,
				)
			: [...this.lines, new CheckoutLine(productId, variantId, 1)];

		return new Checkout(this.id, this.deliveryMethod, this.status, lines);
	}

	removeVariant(variantId: string): Checkout {
		return new Checkout(
			this.id,
			this.deliveryMethod,
			this.status,
			this.lines.filter((line) => line.variantId !== variantId),
		);
	}

	clear(): Checkout {
		return new Checkout(this.id, this.deliveryMethod, "draft", []);
	}

	itemCount(): number {
		return this.lines.reduce((total, line) => total + line.quantity, 0);
	}

	isEmpty(): boolean {
		return this.lines.length === 0;
	}

	toPrimitives(): CheckoutPrimitives {
		return {
			id: this.id.value,
			deliveryMethod: this.deliveryMethod,
			status: this.status,
			lines: this.lines.map((line) => line.toPrimitives()),
		};
	}
}
