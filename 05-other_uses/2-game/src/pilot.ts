import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
	createGateway,
	experimental_decide as decide,
	type Experimental_DecisionModel as DecisionModel,
} from "ai";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { type GameActionId, gameActionCriteria } from "./actions.ts";

type Surroundings = {
	situation: string;
	nearestObstacle: Record<string, string | number | boolean> | null;
	rewardBlockAbove: boolean;
	onGround: boolean;
};

type GameState = {
	mode: "title" | "human" | "system-one";
	turn: number;
	status: "playing" | "dying" | "winning" | "won" | "gameOver";
	lives: number;
	score: number;
	coins: number;
	progressPercent: number;
	surroundings: Surroundings;
};

type TurnResult = {
	events: { type: string }[];
	state: GameState;
};

type McpServerConfig = {
	command: string;
	args?: string[];
	env?: Record<string, string>;
};

type Decision = {
	action: GameActionId;
	probabilities: Record<string, number>;
	danger: number;
	latencyMs: number;
};

const projectRoot = join(import.meta.dirname, "..");

const questions = {
	action: {
		type: "choice",
		instructions:
			"Turbotuga runs to the right in a 2D platform game. Which action must Turbotuga take now to reach the end of the level without losing a life?",
		criteria: gameActionCriteria,
	},
	danger: {
		type: "boolean",
		instructions:
			"Will Turbotuga lose a life if it keeps walking forward right now?",
	},
} as const;
const mcpServerName = "turbotuga";

const { values: options } = parseArgs({
	options: {
		model: { type: "string", default: process.env.PILOT_MODEL ?? "typesafe-ai/jev" },
		turns: { type: "string", default: "300" },
		pause: { type: "string", default: "250" },
	},
});

async function connectToGame(): Promise<Client> {
	const { mcpServers } = JSON.parse(
		await readFile(join(projectRoot, ".mcp.json"), "utf8"),
	) as { mcpServers: Record<string, McpServerConfig> };
	const server = mcpServers[mcpServerName];

	const client = new Client({ name: "turbotuga-pilot", version: "0.1.0" });
	await client.connect(
		new StdioClientTransport({
			command: server.command,
			args: server.args,
			env: { ...process.env, ...server.env } as Record<string, string>,
			cwd: projectRoot,
		}),
	);

	return client;
}

async function callTool<T>(
	client: Client,
	name: string,
	args: Record<string, unknown> = {},
): Promise<T> {
	const result = await client.callTool({ name, arguments: args });
	const [content] = result.content as { type: string; text: string }[];

	if (result.isError) {
		throw new Error(content.text);
	}

	return JSON.parse(content.text) as T;
}

async function decideNextAction(
	model: DecisionModel,
	surroundings: Surroundings,
): Promise<Decision> {
	const startedAt = performance.now();

	const { answers } = await decide({
		model,
		state: surroundings,
		questions,
	});

	return {
		action: answers.action.choice,
		probabilities: answers.action.probabilities ?? { [answers.action.choice]: 1 },
		danger: answers.danger.probability,
		latencyMs: Math.round(performance.now() - startedAt),
	};
}

function isFinished(state: GameState): boolean {
	return state.status === "won" || state.status === "gameOver";
}

function describeTurn(turn: number, decision: Decision, state: GameState): string {
	const confidence = Math.round((decision.probabilities[decision.action] ?? 0) * 100);

	return `#${turn} ${decision.action} (${confidence}%) · ${decision.latencyMs} ms · ${state.surroundings.situation}`;
}

const apiKey = process.env.AI_GATEWAY_API_KEY;

if (!apiKey) {
	console.error("AI_GATEWAY_API_KEY is not set. Add it to .env.local.");
	process.exit(1);
}

const model = createGateway({ apiKey }).decisionModel(options.model);
const client = await connectToGame();
const maxTurns = Number(options.turns);

process.on("SIGTERM", async () => {
	await client.close();
	process.exit(0);
});
const pauseMs = Number(options.pause);

try {
	let state = await callTool<GameState>(client, "get_game_state");

	if (state.mode === "title" || isFinished(state)) {
		({ state } = await callTool<TurnResult>(client, "restart_level"));
	}

	if (state.turn === 0) {
		console.log(`🧠 ${options.model} takes control of Turbotuga`);
	} else {
		console.log(`🧠 ${options.model} resumes the game at turn ${state.turn + 1}`);
	}

	for (let turns = 0; turns < maxTurns && !isFinished(state); turns++) {
		const decision = await decideNextAction(model, state.surroundings);
		console.log(describeTurn(state.turn + 1, decision, state));

		const result = await callTool<TurnResult>(client, "perform_action", {
			action: decision.action,
			decision: {
				model: options.model,
				request: {
					model: options.model,
					state: state.surroundings,
					questions,
				},
				probabilities: decision.probabilities,
				danger: decision.danger,
				latencyMs: decision.latencyMs,
			},
		});
		state = result.state;

		if (result.events.length > 0) {
			console.log(`   ${result.events.map(({ type }) => type).join(", ")}`);
		}

		await new Promise((resolve) => setTimeout(resolve, pauseMs));
	}

	console.log(
		state.status === "won"
			? `🚀 Deployed to production with ${state.score} points and ${state.coins} coins`
			: `💥 The pilot stopped with status ${state.status}`,
	);
} finally {
	await client.close();
}
