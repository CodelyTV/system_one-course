import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { gameActionCriteria, gameActionIds } from "./actions.ts";

const gameUrl = process.env.TURBOTUGA_URL ?? "http://localhost:3200";

const actionsGuide = gameActionIds
	.map((action) => `- ${action}: ${gameActionCriteria[action]}`)
	.join("\n");

type ToolResult = {
	isError?: boolean;
	content: { type: "text"; text: string }[];
};

async function callGame(path: string, init?: RequestInit): Promise<ToolResult> {
	try {
		const response = await fetch(`${gameUrl}${path}`, {
			...init,
			headers: { "content-type": "application/json" },
		});
		const body = await response.text();

		return {
			isError: !response.ok,
			content: [{ type: "text", text: body }],
		};
	} catch {
		return {
			isError: true,
			content: [
				{
					type: "text",
					text: `The Turbotuga game server is not running on ${gameUrl}. Start it with npm run start.`,
				},
			],
		};
	}
}

const server = new McpServer({ name: "turbotuga", version: "0.1.0" });

server.registerTool(
	"get_game_state",
	{
		title: "Get game state",
		description:
			"Get the current state of the Turbotuga platform game: status, lives, score, progress and what Turbotuga sees ahead (the nearest obstacle and its distance in tiles).",
		annotations: { readOnlyHint: true },
	},
	async () => await callGame("/api/state"),
);

server.registerTool(
	"perform_action",
	{
		title: "Perform action",
		description: `Make Turbotuga perform one action in the game and wait until it ends. Returns the events of the turn and the new game state. The game shows the decision on screen.\n\nActions:\n${actionsGuide}`,
		inputSchema: {
			action: z.enum(gameActionIds).describe("The action to perform."),
			decision: z
				.object({
					model: z
						.string()
						.describe("The model that took the decision, for example typesafe-ai/jev."),
					request: z
						.record(z.string(), z.unknown())
						.optional()
						.describe("The request sent to the model: its state and its questions."),
					probabilities: z
						.record(z.string(), z.number())
						.optional()
						.describe("Probability of each action, from 0 to 1."),
					danger: z
						.number()
						.optional()
						.describe("Probability that Turbotuga is in danger, from 0 to 1."),
					latencyMs: z
						.number()
						.optional()
						.describe("Time that the model took to decide, in milliseconds."),
				})
				.optional()
				.describe("Details of the decision to show them on screen."),
		},
	},
	async ({ action, decision }) =>
		await callGame("/api/actions", {
			method: "POST",
			body: JSON.stringify({ action, decision }),
		}),
);

server.registerTool(
	"restart_level",
	{
		title: "Restart level",
		description:
			"Restart the level from the beginning with all the lives, and switch the game to the System One mode.",
	},
	async () => await callGame("/api/restart", { method: "POST" }),
);

await server.connect(new StdioServerTransport());
