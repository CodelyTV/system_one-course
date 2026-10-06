export type SpamCase = {
	rating: number;
	comment: string;
	isSpam: boolean;
};

export const spamCases: SpamCase[] = [
	{ rating: 5, comment: "BUY NOW the best crypto deals", isSpam: true },
	{
		rating: 5,
		comment: "Use discount code SAVE50 at my store for half price",
		isSpam: true,
	},
	{
		rating: 5,
		comment:
			"Earn 5000€ a week working from home! Message me on WhatsApp +34 600 000 000",
		isSpam: true,
	},
	{
		rating: 5,
		comment:
			"Fits perfectly. The cotton is soft and the colour did not fade after washing. Highly recommend! Also, my cousin's bakery in Valencia makes the best croissants, go visit Panadería Lola on Calle Mayor",
		isSpam: true,
	},
];
