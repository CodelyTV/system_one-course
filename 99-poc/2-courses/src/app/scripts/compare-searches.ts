/* eslint-disable no-console */
import "reflect-metadata";

import { OllamaCourseEmbeddingsGenerator } from "../../contexts/mooc/courses/infrastructure/OllamaCourseEmbeddingsGenerator";
import { container } from "../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { PostgresConnection } from "../../contexts/shared/infrastructure/postgres/PostgresConnection";

type CourseMatch = {
	id: string;
	name: string;
	score: number;
};

type TimedSearch = {
	matches: CourseMatch[];
	elapsedMs: number;
};

const resultsLimit = 5;

async function searchByEmbeddings(
	prompt: string,
	connection: PostgresConnection,
	embeddingsGenerator: OllamaCourseEmbeddingsGenerator,
): Promise<CourseMatch[]> {
	const embedding = JSON.stringify(
		await embeddingsGenerator.generateForSearchQuery(prompt),
	);

	return await connection.sql<CourseMatch[]>`
		SELECT id, name, 1 - (embedding <=> ${embedding}) AS score
		FROM mooc.courses
		ORDER BY embedding <=> ${embedding}
		LIMIT ${resultsLimit};
	`;
}

async function searchByJev(
	prompt: string,
	connection: PostgresConnection,
): Promise<CourseMatch[]> {
	return await connection.sql<CourseMatch[]>`
		SELECT courses.id, courses.name, jev_prob(documents, ${prompt}) AS score
		FROM mooc.course_search_documents documents
		INNER JOIN mooc.courses courses ON courses.name = documents.name
		WHERE jev(documents, ${prompt})
		ORDER BY score DESC;
	`;
}

async function measure(
	search: () => Promise<CourseMatch[]>,
): Promise<TimedSearch> {
	const startedAt = performance.now();
	const matches = await search();

	return { matches, elapsedMs: performance.now() - startedAt };
}

function formatElapsed(elapsedMs: number): string {
	return elapsedMs < 1000
		? `${elapsedMs.toFixed(0)} ms`
		: `${(elapsedMs / 1000).toFixed(2)} s`;
}

function print(title: string, detail: string, search: TimedSearch): void {
	console.log(`\n${title} · ${formatElapsed(search.elapsedMs)}`);
	console.log(`  ${detail}`);

	if (search.matches.length === 0) {
		console.log("  No courses found.");
	}

	search.matches.slice(0, resultsLimit).forEach((match, index) => {
		console.log(
			`  ${String(index + 1).padStart(2)}. [${Number(match.score).toFixed(3)}] ${match.name} (${match.id})`,
		);
	});
}

async function main(
	prompt: string | undefined,
	connection: PostgresConnection,
	embeddingsGenerator: OllamaCourseEmbeddingsGenerator,
): Promise<void> {
	if (!prompt) {
		console.error('Usage: pnpm compare-searches "<prompt>"');
		process.exitCode = 1;

		return;
	}

	await embeddingsGenerator.generateForSearchQuery("warmup");

	const embeddings = await measure(() =>
		searchByEmbeddings(prompt, connection, embeddingsGenerator),
	);
	const jev = await measure(() => searchByJev(prompt, connection));

	console.log(`Prompt: "${prompt}"`);
	print(
		"Embeddings (Ollama qwen3-embedding:4b + pgvector)",
		`Top ${resultsLimit} courses by cosine similarity`,
		embeddings,
	);
	print(
		"pg-jev (Laya)",
		`${jev.matches.length} courses match jev(); top ${resultsLimit} by jev_prob`,
		jev,
	);
}

const connection = container.get(PostgresConnection);

main(
	process.argv[2],
	connection,
	container.get(OllamaCourseEmbeddingsGenerator),
)
	.catch(console.error)
	.finally(async () => {
		await connection.end();
	});
