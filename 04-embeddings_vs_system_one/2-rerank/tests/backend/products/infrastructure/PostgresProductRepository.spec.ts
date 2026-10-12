import { MockEmbeddingModelV4 } from "ai/test";
import { expect, it } from "vitest";

import { PostgresProductRepository } from "@/contexts/backend/products/infrastructure/PostgresProductRepository";
import { PostgresConnection } from "@/contexts/backend/shared/infrastructure/PostgresConnection";

import { describeWithEnvironmentArranger } from "../../shared/infrastructure/describeWithEnvironmentArranger";
import { RetailEnvironmentArranger } from "../../shared/infrastructure/RetailEnvironmentArranger";
import { ProductMother } from "../domain/ProductMother";

const keywords = ["hoodie", "tee", "trousers"];

function keywordEmbedding(value: string): number[] {
	const embedding = Array<number>(768).fill(0);
	const index = keywords.findIndex((keyword) =>
		value.toLowerCase().includes(keyword),
	);
	embedding[index === -1 ? keywords.length : index] = 1;

	return embedding;
}

async function embedByKeyword({
	values,
}: {
	values: unknown[];
}): Promise<{ embeddings: number[][]; warnings: never[] }> {
	return {
		embeddings: values.map((value) => keywordEmbedding(String(value))),
		warnings: [],
	};
}

const connection = new PostgresConnection();
const arranger = new RetailEnvironmentArranger(connection);
const repository = new PostgresProductRepository(
	connection,
	new MockEmbeddingModelV4({
		doEmbed: embedByKeyword,
	}),
);

describeWithEnvironmentArranger(
	arranger,
	"PostgresProductRepository should",
	() => {
		it("save a product and read it back", async () => {
			const product = ProductMother.create();

			await repository.save(product);

			expect(
				(await repository.search(product.id))?.toPrimitives(),
			).toEqual(product.toPrimitives());
		});

		it("search the products most similar to a query", async () => {
			const hoodie = ProductMother.create({ name: "Aggregate Hoodie" });
			const tee = ProductMother.create({ name: "Domain Event Tee" });
			const trousers = ProductMother.create({
				name: "Bounded Context Trousers",
			});
			await repository.save(hoodie);
			await repository.save(tee);
			await repository.save(trousers);

			const similar = await repository.searchSimilar("a cozy hoodie", 1);

			expect(similar.map((product) => product.toPrimitives())).toEqual([
				hoodie.toPrimitives(),
			]);
		});
	},
);
