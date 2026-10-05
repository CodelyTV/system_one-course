import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
	conversationStatuses,
	findConversation,
	searchConversations,
} from "./conversations.ts";

const server = new McpServer({ name: "customer-support", version: "0.1.0" });

server.registerTool(
	"list_conversations",
	{
		title: "List conversations",
		description:
			"List the customer support conversations of Codely Retail with their customer and all their messages, newest first. Filter them by status.",
		inputSchema: {
			statuses: z
				.array(z.enum(conversationStatuses))
				.optional()
				.describe("Statuses to include. All statuses if omitted."),
		},
		annotations: { readOnlyHint: true },
	},
	async ({ statuses }) => ({
		content: [
			{
				type: "text",
				text: JSON.stringify(await searchConversations(statuses)),
			},
		],
	}),
);

server.registerTool(
	"get_conversation",
	{
		title: "Get conversation",
		description:
			"Get one customer support conversation of Codely Retail by its id, with its customer and all its messages.",
		inputSchema: {
			id: z.string().describe("Conversation id, for example conv-001"),
		},
		annotations: { readOnlyHint: true },
	},
	async ({ id }) => {
		const conversation = await findConversation(id);

		if (!conversation) {
			return {
				isError: true,
				content: [
					{ type: "text", text: `Conversation ${id} not found` },
				],
			};
		}

		return {
			content: [{ type: "text", text: JSON.stringify(conversation) }],
		};
	},
);

await server.connect(new StdioServerTransport());
