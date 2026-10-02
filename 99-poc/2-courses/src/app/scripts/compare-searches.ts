/* eslint-disable no-console */
import "reflect-metadata";

import { OllamaCourseEmbeddingsGenerator } from "../../contexts/mooc/courses/infrastructure/OllamaCourseEmbeddingsGenerator";
import { container } from "../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { PostgresConnection } from "../../contexts/shared/infrastructure/postgres/PostgresConnection";

type Sql = PostgresConnection["sql"];

type CourseMatch = {
	id: string;
	name: string;
	score: number;
};

type TimedSearch = {
	matches: CourseMatch[];
	elapsedMs: number;
	error?: string;
};

type JevProvider = {
	title: string;
	settings: Record<string, string>;
};

type JevSearch = {
	provider: JevProvider;
	search: TimedSearch;
};

const resultsLimit = 5;

const hostFromDocker =
	process.env.DOCKER_HOST_GATEWAY ?? "host.docker.internal";

const laya: JevProvider = {
	title: "pg-jev (Laya · local)",
	settings: {
		"jev.api_url": "http://laya:8000/v1/systemone",
		"jev.api_key": "courses-laya",
		"jev.model": "jev-latest",
		"jev.batch_size": "1",
		"jev.concurrency": "4",
		"jev.timeout": "120",
	},
};

const layaMlx: JevProvider = {
	title: "pg-jev (Laya MLX · local Apple Silicon)",
	settings: {
		"jev.api_url": `http://${hostFromDocker}:58001/v1/systemone`,
		"jev.api_key": "courses-laya-mlx",
		"jev.model": "jev-latest",
		"jev.batch_size": "1",
		"jev.concurrency": "4",
		"jev.timeout": "120",
	},
};

const kev: JevProvider = {
	title: `pg-jev (Kev · ${process.env.KEV_MODEL ?? "jaredpalmer/kev-4b"} · threshold ${process.env.KEV_THRESHOLD ?? "0.5"} · local Apple Silicon)`,
	settings: {
		"jev.api_url": `http://${hostFromDocker}:58002/v1/systemone`,
		"jev.api_key": "courses-kev",
		"jev.model": "kev-latest",
		"jev.threshold": process.env.KEV_THRESHOLD ?? "0.5",
		"jev.batch_size": "1",
		"jev.concurrency": "4",
		"jev.timeout": "120",
	},
};

const vercelJev: JevProvider = {
	title: "pg-jev (Vercel AI Gateway · typesafe-ai/jev)",
	settings: {},
};

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

async function useJevProvider(sql: Sql, provider: JevProvider): Promise<void> {
	await Promise.all(
		Object.entries(provider.settings).map(
			([name, value]) => sql`SELECT set_config(${name}, ${value}, false)`,
		),
	);
}

async function searchByJev(prompt: string, sql: Sql): Promise<CourseMatch[]> {
	return await sql<CourseMatch[]>`
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

	try {
		const matches = await search();

		return { matches, elapsedMs: performance.now() - startedAt };
	} catch (error) {
		return {
			matches: [],
			elapsedMs: performance.now() - startedAt,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

function formatElapsed(elapsedMs: number): string {
	return elapsedMs < 1000
		? `${elapsedMs.toFixed(0)} ms`
		: `${(elapsedMs / 1000).toFixed(2)} s`;
}

function print(title: string, detail: string, search: TimedSearch): void {
	console.log(`\n${title} · ${formatElapsed(search.elapsedMs)}`);

	if (search.error) {
		console.log(`  Unavailable: ${search.error}`);

		return;
	}

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

	const providers = [laya, layaMlx, kev, vercelJev];
	const sessions = await Promise.all(
		providers.map(() => connection.sql.reserve()),
	);

	try {
		await Promise.all(
			providers.map((provider, index) =>
				useJevProvider(sessions[index], provider),
			),
		);

		const jevSearches = await providers.reduce<Promise<JevSearch[]>>(
			async (previousSearches, provider, index) => [
				...(await previousSearches),
				{
					provider,
					search: await measure(() =>
						searchByJev(prompt, sessions[index]),
					),
				},
			],
			Promise.resolve([]),
		);

		printResults(prompt, embeddings, jevSearches);
	} finally {
		sessions.forEach((session) => {
			session.release();
		});
	}
}

function printResults(
	prompt: string,
	embeddings: TimedSearch,
	jevSearches: JevSearch[],
): void {
	console.log(`Prompt: "${prompt}"`);
	print(
		"Embeddings (Ollama qwen3-embedding:4b + pgvector)",
		`Top ${resultsLimit} courses by cosine similarity`,
		embeddings,
	);
	jevSearches.forEach(({ provider, search }) => {
		print(
			provider.title,
			`${search.matches.length} courses match jev(); top ${resultsLimit} by jev_prob`,
			search,
		);
	});
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
