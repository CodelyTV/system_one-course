export type Currency = "EUR";

export type MoneyPrimitives = {
	amount: number;
	currency: Currency;
};

export class Money {
	constructor(
		public readonly amount: number,
		public readonly currency: Currency,
	) {}

	static fromPrimitives(primitives: MoneyPrimitives): Money {
		return new Money(primitives.amount, primitives.currency);
	}

	toPrimitives(): MoneyPrimitives {
		return { amount: this.amount, currency: this.currency };
	}
}
