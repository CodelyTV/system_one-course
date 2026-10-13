import {
	experimental_decide as decide,
	type Experimental_DecisionModel as DecisionModel,
} from "ai";

import { type BrowserOption, browserOptions, type PageState } from "./actions.ts";
import type { BrowserSession } from "./browser.ts";

export type PilotEvent =
	| { type: "started"; goal: string; model: string; stepByStep: boolean }
	| { type: "paused"; step: number }
	| { type: "thinking"; step: number; page: PageState }
	| {
			type: "decision";
			step: number;
			request: { state: DecisionState; questions: DecisionQuestions };
			options: Omit<BrowserOption, "action">[];
			choice: string;
			probabilities: Record<string, number>;
			completed: number;
			latencyMs: number;
	  }
	| { type: "performed"; step: number; error?: string; url: string; title: string }
	| { type: "finished"; status: "done" | "stopped" | "max_steps" | "no_options" | "error"; error?: string };

type DecisionState = {
	goal: string;
	currentPage: { url: string; title: string };
	previousActions: string[];
};

type DecisionQuestions = ReturnType<typeof buildQuestions>;

type PilotTask = {
	goal: string;
	session: BrowserSession;
	model: DecisionModel;
	modelId: string;
	maxSteps: number;
	signal: AbortSignal;
	emit: (event: PilotEvent) => void;
	waitForNextStep?: () => Promise<void>;
};

function buildQuestions(options: BrowserOption[]) {
	return {
		action: {
			type: "choice",
			instructions:
				"An agent controls a web browser to complete the goal of the user, one action at a time. Follow the steps of the goal in their order. Which action must the agent take now to get closer to the goal? Do not repeat an action that is already in the previous actions.",
			criteria: Object.fromEntries(options.map(({ id, description }) => [id, description])),
		},
		completed: {
			type: "boolean",
			instructions: "Does the current page already complete the whole goal of the user?",
		},
	} as const;
}

export async function runPilot({
	goal,
	session,
	model,
	modelId,
	maxSteps,
	signal,
	emit,
	waitForNextStep,
}: PilotTask): Promise<void> {
	const previousActions: string[] = [];

	emit({ type: "started", goal, model: modelId, stepByStep: waitForNextStep !== undefined });
	await session.reset();

	for (let step = 1; step <= maxSteps; step++) {
		if (waitForNextStep && step > 1) {
			emit({ type: "paused", step });
			await waitForNextStep();
		}

		if (signal.aborted) {
			emit({ type: "finished", status: "stopped" });

			return;
		}

		const page = await session.readPage();
		const options = browserOptions(goal, page);

		if (options.length === 0) {
			emit({ type: "finished", status: "no_options" });

			return;
		}

		emit({ type: "thinking", step, page });

		const state: DecisionState = {
			goal,
			currentPage: { url: page.url, title: page.title },
			previousActions,
		};
		const questions = buildQuestions(options);
		const startedAt = performance.now();
		const { answers } = await decide({ model, state, questions, abortSignal: signal });
		const option = options.find(({ id }) => id === answers.action.choice) ?? options[0];

		emit({
			type: "decision",
			step,
			request: { state, questions },
			options: options.map(({ id, description }) => ({ id, description })),
			choice: option.id,
			probabilities: answers.action.probabilities ?? { [option.id]: 1 },
			completed: answers.completed.probability,
			latencyMs: Math.round(performance.now() - startedAt),
		});

		if (option.action.type === "done") {
			emit({ type: "finished", status: "done" });

			return;
		}

		let error: string | undefined;

		try {
			await session.perform(option.action);
		} catch (cause) {
			error = (cause as Error).message.split("\n")[0];
		}

		const performed = await session.readPage();
		previousActions.push(`${option.description}${error ? " It failed." : ""}`);
		emit({ type: "performed", step, error, url: performed.url, title: performed.title });
	}

	emit({ type: "finished", status: "max_steps" });
}
