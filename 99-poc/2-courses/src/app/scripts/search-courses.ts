/* eslint-disable no-console */
import "reflect-metadata";

import { OllamaCourseEmbeddingsGenerator } from "../../contexts/mooc/courses/infrastructure/OllamaCourseEmbeddingsGenerator";
import { container } from "../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { PostgresConnection } from "../../contexts/shared/infrastructure/postgres/PostgresConnection";

async function main(
	query: string,
	connection: PostgresConnection,
	embeddingsGenerator: OllamaCourseEmbeddingsGenerator,
): Promise<void> {
	const embedding = `[${(await embeddingsGenerator.generateForSearchQuery(query)).join(",")}]`;

	const results = await connection.sql`
		SELECT id, name, summary, categories, published_at
		FROM mooc.courses
		ORDER BY (embedding <-> ${embedding})
		LIMIT 3;
	`;

	console.log(`For the query "${query}" the results are:`, results);
}

const pgConnection = container.get(PostgresConnection);

const embeddingsGenerator = container.get(OllamaCourseEmbeddingsGenerator);

main(process.argv[2], pgConnection, embeddingsGenerator)
	.catch(console.error)
	.finally(async () => {
		await pgConnection.end();
		console.log("Done!");

		process.exit(0);
	});
