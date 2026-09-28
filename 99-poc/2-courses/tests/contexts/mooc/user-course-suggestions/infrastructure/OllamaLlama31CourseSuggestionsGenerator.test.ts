import "reflect-metadata";

import { faker } from "@faker-js/faker";

import courses from "../../../../../src/app/scripts/courses.json";
import { PostgresCourseRepository } from "../../../../../src/contexts/mooc/courses/infrastructure/PostgresCourseRepository";
import { CourseSuggestion } from "../../../../../src/contexts/mooc/user-course-suggestions/domain/CourseSuggestion";
import { OllamaLlama31CourseSuggestionsGenerator } from "../../../../../src/contexts/mooc/user-course-suggestions/infrastructure/OllamaLlama31CourseSuggestionsGenerator";
import { container } from "../../../../../src/contexts/shared/infrastructure/dependency-injection/diod.config";
import { PostgresConnection } from "../../../../../src/contexts/shared/infrastructure/postgres/PostgresConnection";
import { UserCourseSuggestionsMother } from "../domain/UserCourseSuggestionsMother";

const connection = container.get(PostgresConnection);
const generator = new OllamaLlama31CourseSuggestionsGenerator(
	container.get(PostgresCourseRepository),
);

describe("OllamaLlama31CourseSuggestionsGenerator should", () => {
	const existingCourseIds = courses.map((course) => course.id);
	const completedCourseIds = faker.helpers.arrayElements(
		existingCourseIds,
		4,
	);
	let suggestions: CourseSuggestion[];

	beforeAll(async () => {
		suggestions = await generator.generate(
			UserCourseSuggestionsMother.withoutSuggestions(completedCourseIds),
		);
	}, 60000);

	afterAll(async () => {
		await connection.end();
	});

	it("suggest only 3 courses", () => {
		expect(suggestions.length).toBe(3);
	});

	it("suggest only existing courses", () => {
		const suggestedCourseIds = suggestions.map(
			(suggestion) => suggestion.courseId,
		);

		expect(existingCourseIds).toEqual(
			expect.arrayContaining(suggestedCourseIds),
		);
	});

	it("suggest only courses that have not been completed", () => {
		const suggestedCourseIds = suggestions.map(
			(suggestion) => suggestion.courseId,
		);

		expect(completedCourseIds).not.toEqual(
			expect.arrayContaining(suggestedCourseIds),
		);
	});
});
