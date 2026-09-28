import { Primitives } from "@codelytv/primitives-type";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Service } from "diod";

import { Course } from "../domain/Course";

@Service()
export class OllamaCourseEmbeddingsGenerator {
	private readonly embeddings = new OllamaEmbeddings({
		model: "qwen3-embedding:4b",
		baseUrl: "http://localhost:11434",
	});

	async generateForCourse(course: Primitives<Course>): Promise<number[]> {
		const [embedding] = await this.embeddings.embedDocuments([
			this.serialize(course),
		]);

		return embedding;
	}

	async generateForSearchQuery(query: string): Promise<number[]> {
		return await this.embeddings.embedQuery(
			this.withInstruction(
				"Given a web search query, retrieve relevant courses that answer the query",
				query,
			),
		);
	}

	async generateForSimilarCourses(
		courses: Primitives<Course>[],
	): Promise<number[]> {
		return await this.embeddings.embedQuery(
			this.withInstruction(
				"Given the courses a user has completed, retrieve other courses the user would like to take next",
				courses.map((course) => this.serialize(course)).join("\n"),
			),
		);
	}

	private withInstruction(instruction: string, query: string): string {
		return `Instruct: ${instruction}\nQuery: ${query}`;
	}

	private serialize(course: Primitives<Course>): string {
		return [
			`Name: ${course.name}`,
			`Summary: ${course.summary}`,
			`Categories: ${course.categories.join(", ")}`,
		].join("|");
	}
}
