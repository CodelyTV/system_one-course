import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
	createGateway,
	experimental_evaluate as evaluate,
	type Experimental_EvaluationModel as EvaluationModel,
} from "ai";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

type Message = {
	author: "customer" | "agent";
	authorName: string;
	body: string;
	sentAt: string;
};

type Conversation = {
	id: string;
	subject: string;
	status: string;
	channel: string;
	customer: { name: string; segment: string; lifetimeValue: number };
	assignee: string | null;
	tags: string[];
	orderId: string | null;
	updatedAt: string;
	messages: Message[];
};

type McpServerConfig = {
	command: string;
	args?: string[];
	env?: Record<string, string>;
};

type EvaluationState = Parameters<typeof evaluate>[0]["state"];

type ScoredConversation = {
	conversation: Conversation;
	score: number;
	level: string;
};

const projectRoot = join(import.meta.dirname, "..", "..", "..", "..");
const mcpServerName = "customer-support";
const concurrency = 10;

const priorityLevels = [
	"Can wait: compliments, feedback, suggestions or general questions with no open order problem.",
	"Low: product, size, care or restock questions with no deadline and no money at risk.",
	"Medium: an order needs an action soon (exchange, address change, discount code, tracking) but nothing is lost yet.",
	"High: the customer lost money or got a wrong, damaged or missing item, a payment failed, or a refund is overdue.",
	"Critical: fraud, account takeover, privacy or health risk, a duplicate charge, a legal or chargeback threat, or a deadline in the next 24 hours.",
];

const { values: options } = parseArgs({
	options: {
		statuses: { type: "string", default: "open,pending" },
		limit: { type: "string" },
	},
});

async function fetchConversations(statuses: string[]): Promise<Conversation[]> {
	const { mcpServers } = JSON.parse(
		await readFile(join(projectRoot, ".mcp.json"), "utf8"),
	) as {
		mcpServers: Record<string, McpServerConfig>;
	};
	const server = mcpServers[mcpServerName];

	const client = new Client({
		name: "customer-support-prioritize",
		version: "0.1.0",
	});
	await client.connect(
		new StdioClientTransport({
			command: server.command,
			args: server.args,
			env: server.env,
			cwd: projectRoot,
		}),
	);

	try {
		const result = await client.callTool({
			name: "list_conversations",
			arguments: { statuses },
		});
		const [content] = result.content as { type: string; text: string }[];

		return JSON.parse(content.text) as Conversation[];
	} finally {
		await client.close();
	}
}

function hoursSince(isoDate: string): number {
	return Math.round((Date.now() - new Date(isoDate).getTime()) / 3_600_000);
}

function toEvaluationState(conversation: Conversation): EvaluationState {
	const lastMessage = conversation.messages.at(-1);

	return {
		subject: conversation.subject,
		channel: conversation.channel,
		status: conversation.status,
		customerSegment: conversation.customer.segment,
		customerLifetimeValueEur: conversation.customer.lifetimeValue,
		hasOrder: conversation.orderId !== null,
		tags: conversation.tags,
		lastMessageAuthor: lastMessage?.author ?? null,
		hoursSinceLastMessage: lastMessage
			? hoursSince(lastMessage.sentAt)
			: null,
		messages: conversation.messages.map(({ author, body, sentAt }) => ({
			author,
			body,
			sentAt,
		})),
	};
}

async function score(
	model: EvaluationModel,
	conversation: Conversation,
): Promise<ScoredConversation> {
	const { answers } = await evaluate({
		model,
		state: toEvaluationState(conversation),
		questions: {
			priority: {
				type: "score",
				instructions:
					"How urgent is it for the customer support team of an online clothing store to answer this conversation now?",
				criteria: priorityLevels,
			},
		},
	});

	return {
		conversation,
		score: answers.priority.score,
		level: priorityLevels[Math.round(answers.priority.score)].split(":")[0],
	};
}

async function scoreAll(
	model: EvaluationModel,
	conversations: Conversation[],
): Promise<ScoredConversation[]> {
	const scored: ScoredConversation[] = [];
	const pending = [...conversations];

	async function worker(): Promise<void> {
		for (
			let conversation = pending.shift();
			conversation;
			conversation = pending.shift()
		) {
			scored.push(await score(model, conversation));
			if (process.stderr.isTTY) {
				process.stderr.write(
					`\rScored ${scored.length}/${conversations.length} conversations`,
				);
			}
		}
	}

	await Promise.all(Array.from({ length: concurrency }, worker));

	if (process.stderr.isTTY) {
		process.stderr.write("\n");
	}

	return scored.sort(byPriority);
}

function isWaitingForCustomerSupport(conversation: Conversation): boolean {
	return conversation.messages.at(-1)?.author === "customer";
}

function byPriority(a: ScoredConversation, b: ScoredConversation): number {
	return (
		b.score - a.score ||
		Number(isWaitingForCustomerSupport(b.conversation)) -
			Number(isWaitingForCustomerSupport(a.conversation)) ||
		a.conversation.updatedAt.localeCompare(b.conversation.updatedAt)
	);
}

function toMarkdownTable(scored: ScoredConversation[]): string {
	const maxScore = priorityLevels.length - 1;
	const rows = scored.map(({ conversation, score, level }, index) =>
		[
			index + 1,
			((score / maxScore) * 100).toFixed(1),
			level,
			conversation.id,
			conversation.subject.replaceAll("|", "\\|"),
			`${conversation.customer.name} (${conversation.customer.segment})`,
			isWaitingForCustomerSupport(conversation) ? "customer" : "agent",
			`${hoursSince(conversation.updatedAt)}h`,
		].join(" | "),
	);

	return [
		"| # | Priority (0-100) | Level | ID | Subject | Customer | Last message by | Idle |",
		"|---|---|---|---|---|---|---|---|",
		...rows.map((row) => `| ${row} |`),
	].join("\n");
}

const apiKey = process.env.VERCEL_AI_GATEWAY_API_KEY;

if (!apiKey) {
	console.error(
		"VERCEL_AI_GATEWAY_API_KEY is not set. Add it to .env.local in the project root.",
	);
	process.exit(1);
}

const model = createGateway({ apiKey }).evaluationModel("typesafe-ai/jev");
const conversations = await fetchConversations(options.statuses.split(","));
const scored = await scoreAll(model, conversations);
const limit = options.limit ? Number(options.limit) : scored.length;

process.stdout.write(`${toMarkdownTable(scored.slice(0, limit))}\n`);
