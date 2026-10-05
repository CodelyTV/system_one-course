import { afterAll, beforeEach, describe } from "vitest";

import type { RetailEnvironmentArranger } from "./RetailEnvironmentArranger";

export function describeWithEnvironmentArranger(
	arranger: RetailEnvironmentArranger,
	suiteName: string,
	fn: () => void,
): void {
	describe(suiteName, () => {
		beforeEach(async () => {
			await arranger.arrange();
		});

		afterAll(async () => {
			await arranger.close();
		});

		fn();
	});
}
