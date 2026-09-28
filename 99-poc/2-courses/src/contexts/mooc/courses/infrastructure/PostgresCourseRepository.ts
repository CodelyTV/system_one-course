import { ISODateTime } from "@codelytv/primitives-type";
import { Service } from "diod";

import { PostgresConnection } from "../../../shared/infrastructure/postgres/PostgresConnection";
import { PostgresRepository } from "../../../shared/infrastructure/postgres/PostgresRepository";
import { Course } from "../domain/Course";
import { CourseId } from "../domain/CourseId";
import { CourseRepository } from "../domain/CourseRepository";

import { OllamaCourseEmbeddingsGenerator } from "./OllamaCourseEmbeddingsGenerator";

type DatabaseCourseRow = {
	id: string;
	name: string;
	summary: string;
	categories: string[];
	published_at: Date;
};

@Service()
export class PostgresCourseRepository
	extends PostgresRepository<Course>
	implements CourseRepository
{
	constructor(
		connection: PostgresConnection,
		private readonly embeddingsGenerator: OllamaCourseEmbeddingsGenerator,
	) {
		super(connection);
	}

	async save(course: Course): Promise<void> {
		const userPrimitives = course.toPrimitives();
		const embedding = JSON.stringify(
			await this.embeddingsGenerator.generateForCourse(userPrimitives),
		);

		await this.execute`
			INSERT INTO mooc.courses (id, name, summary, categories, published_at, embedding)
			VALUES (
				${userPrimitives.id},
				${userPrimitives.name},
				${userPrimitives.summary},
				${userPrimitives.categories},
				${userPrimitives.publishedAt},
				${embedding}
			)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				summary = EXCLUDED.summary,
				categories = EXCLUDED.categories,
				published_at = EXCLUDED.published_at,
				embedding = EXCLUDED.embedding;
		`;
	}

	async search(id: CourseId): Promise<Course | null> {
		return await this.searchOne`
			SELECT id, name, summary, categories, published_at
			FROM mooc.courses
			WHERE id = ${id.value};
		`;
	}

	async searchSimilar(ids: CourseId[]): Promise<Course[]> {
		const coursesToSearchSimilar = await this.searchByIds(ids);

		if (coursesToSearchSimilar.length === 0) {
			return [];
		}

		const embeddings = JSON.stringify(
			await this.embeddingsGenerator.generateForSimilarCourses(
				coursesToSearchSimilar.map((course) => course.toPrimitives()),
			),
		);

		const plainIds = ids.map((id) => id.value);
		const recencyWeight = 0.001;

		return await this.searchMany`
			SELECT id, name, summary, categories, published_at
			FROM mooc.courses
			WHERE id != ALL(${plainIds}::text[])
			ORDER BY
				(embedding <=> ${embeddings}) +
				${recencyWeight} * EXTRACT(EPOCH FROM NOW() - published_at) / 86400
			LIMIT 10;
		`;
	}

	async searchByIds(ids: CourseId[]): Promise<Course[]> {
		const plainIds = ids.map((id) => id.value);

		return await this.searchMany`
			SELECT id, name, summary, categories, published_at
			FROM mooc.courses
			WHERE id = ANY(${plainIds}::text[]);
		`;
	}

	protected toAggregate(row: DatabaseCourseRow): Course {
		return Course.fromPrimitives({
			id: row.id,
			name: row.name,
			summary: row.summary,
			categories: row.categories,
			publishedAt: row.published_at.toISOString() as ISODateTime,
		});
	}
}
