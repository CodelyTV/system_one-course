import { readFile } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { extname, join, normalize } from "node:path";

import {
	type ConversationStatus,
	conversationStatuses,
	findConversation,
	searchConversations,
} from "./conversations.ts";

const port = Number(process.env.PORT ?? 3100);
const publicPath = join(import.meta.dirname, "..", "public");

const contentTypes: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".svg": "image/svg+xml",
};

function sendJson(
	response: ServerResponse,
	status: number,
	body: unknown,
): void {
	response.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
	});
	response.end(JSON.stringify(body));
}

function parseStatuses(value: string | null): ConversationStatus[] {
	if (!value) {
		return [...conversationStatuses];
	}

	return value
		.split(",")
		.filter((status): status is ConversationStatus =>
			conversationStatuses.includes(status as ConversationStatus),
		);
}

async function sendStaticFile(
	response: ServerResponse,
	pathname: string,
): Promise<void> {
	const relativePath = normalize(
		pathname === "/" ? "/index.html" : pathname,
	).replace(/^(\.\.[/\\])+/, "");

	try {
		const file = await readFile(join(publicPath, relativePath));
		response.writeHead(200, {
			"content-type":
				contentTypes[extname(relativePath)] ??
				"application/octet-stream",
		});
		response.end(file);
	} catch {
		const index = await readFile(join(publicPath, "index.html"));
		response.writeHead(200, { "content-type": contentTypes[".html"] });
		response.end(index);
	}
}

const server = createServer(async (request, response) => {
	const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

	if (url.pathname === "/api/conversations") {
		sendJson(
			response,
			200,
			await searchConversations(
				parseStatuses(url.searchParams.get("status")),
			),
		);

		return;
	}

	const conversationMatch = /^\/api\/conversations\/([\w-]+)$/.exec(
		url.pathname,
	);

	if (conversationMatch) {
		const conversation = await findConversation(conversationMatch[1]);

		if (!conversation) {
			sendJson(response, 404, {
				error: `Conversation ${conversationMatch[1]} not found`,
			});

			return;
		}

		sendJson(response, 200, conversation);

		return;
	}

	await sendStaticFile(response, url.pathname);
});

server.listen(port, () => {
	process.stdout.write(`Customer support inbox on http://localhost:${port}\n`);
});
