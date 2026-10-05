import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const conversationStatuses = [
	"open",
	"pending",
	"snoozed",
	"closed",
] as const;

export type ConversationStatus = (typeof conversationStatuses)[number];

export type Message = {
	id: string;
	author: "customer" | "agent";
	authorName: string;
	body: string;
	sentAt: string;
};

export type Customer = {
	id: string;
	name: string;
	email: string;
	location: string;
	segment: "new" | "returning" | "vip";
	lifetimeValue: number;
};

export type Conversation = {
	id: string;
	subject: string;
	status: ConversationStatus;
	channel: "chat" | "email" | "whatsapp";
	customer: Customer;
	assignee: string | null;
	tags: string[];
	orderId: string | null;
	createdAt: string;
	updatedAt: string;
	messages: Message[];
};

const conversationsPath = join(
	import.meta.dirname,
	"..",
	"data",
	"conversations.json",
);

export async function searchConversations(
	statuses: readonly ConversationStatus[] = conversationStatuses,
): Promise<Conversation[]> {
	const conversations = JSON.parse(
		await readFile(conversationsPath, "utf8"),
	) as Conversation[];

	return conversations
		.filter((conversation) => statuses.includes(conversation.status))
		.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function findConversation(
	id: string,
): Promise<Conversation | undefined> {
	const conversations = await searchConversations();

	return conversations.find((conversation) => conversation.id === id);
}
