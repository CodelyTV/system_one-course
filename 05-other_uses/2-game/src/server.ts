import { type ChildProcess, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { extname, join, normalize } from "node:path";

import { type GameActionId, gameActionIds } from "./actions.ts";

const port = Number(process.env.PORT ?? 3200);
const projectPath = join(import.meta.dirname, "..");
const publicPath = join(projectPath, "public");
const commandTimeoutMs = 20_000;

const contentTypes: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
};

type GameCommand =
	| { type: "action"; action: GameActionId; decision: unknown }
	| { type: "restart" };

type PendingCommand = {
	resolve: (result: unknown) => void;
	timeout: NodeJS.Timeout;
};

let game: ServerResponse | null = null;
let latestState: unknown = null;
let pilot: ChildProcess | null = null;
const pendingCommands = new Map<string, PendingCommand>();

function sendNoContent(response: ServerResponse, status = 204): void {
	response.writeHead(status);
	response.end();
}

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

function sendEvent(target: ServerResponse, type: string, data: unknown): void {
	target.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

function broadcast(type: string, data: unknown): void {
	if (game) {
		sendEvent(game, type, data);
	}
}

async function readBody<T>(request: IncomingMessage): Promise<T> {
	const chunks: Buffer[] = [];

	for await (const chunk of request) {
		chunks.push(chunk as Buffer);
	}

	return (chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}) as T;
}

const noGameMessage = `The Turbotuga game is not open. Open http://localhost:${port} in a browser first.`;

function connectGame(request: IncomingMessage, response: ServerResponse): void {
	if (game) {
		sendEvent(game, "replaced", {});
		game.end();
	}

	response.writeHead(200, {
		"content-type": "text/event-stream",
		"cache-control": "no-cache",
		connection: "keep-alive",
	});
	game = response;
	sendEvent(response, "pilot", { running: pilot !== null });

	const heartbeat = setInterval(() => response.write(": ping\n\n"), 15_000);

	request.on("close", () => {
		clearInterval(heartbeat);

		if (game === response) {
			game = null;
			latestState = null;
		}
	});
}

function runCommand(command: GameCommand): Promise<unknown> {
	if (!game) {
		return Promise.reject(new Error(noGameMessage));
	}

	const id = randomUUID();

	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			pendingCommands.delete(id);
			reject(new Error("The game did not answer in time."));
		}, commandTimeoutMs);

		pendingCommands.set(id, { resolve, timeout });
		broadcast("command", { id, ...command });
	});
}

function completeCommand(id: string, result: unknown): boolean {
	const pending = pendingCommands.get(id);

	if (!pending) {
		return false;
	}

	clearTimeout(pending.timeout);
	pendingCommands.delete(id);
	pending.resolve(result);

	return true;
}

function startPilot(): void {
	if (pilot) {
		return;
	}

	pilot = spawn(
		process.execPath,
		["--env-file-if-exists=.env.local", "src/pilot.ts"],
		{ cwd: projectPath, stdio: ["ignore", "inherit", "inherit"] },
	);
	pilot.on("exit", () => {
		pilot = null;
		broadcast("pilot", { running: false });
	});
	broadcast("pilot", { running: true });
}

function stopPilot(): void {
	pilot?.kill();
}

async function sendStaticFile(
	response: ServerResponse,
	pathname: string,
): Promise<void> {
	const relativePath = normalize(pathname === "/" ? "/index.html" : pathname);
	const filePath = join(publicPath, relativePath);

	if (!filePath.startsWith(publicPath)) {
		sendJson(response, 403, { error: "Forbidden" });

		return;
	}

	try {
		const content = await readFile(filePath);
		response.writeHead(200, {
			"content-type":
				contentTypes[extname(filePath)] ?? "application/octet-stream",
			"cache-control": "no-cache",
		});
		response.end(content);
	} catch {
		sendJson(response, 404, { error: "Not found" });
	}
}

async function handleCommand(
	response: ServerResponse,
	command: GameCommand,
): Promise<void> {
	try {
		sendJson(response, 200, await runCommand(command));
	} catch (error) {
		sendJson(response, 409, { error: (error as Error).message });
	}
}

const server = createServer(async (request, response) => {
	const url = new URL(request.url ?? "/", `http://localhost:${port}`);
	const route = `${request.method} ${url.pathname}`;

	if (route === "GET /api/events") {
		connectGame(request, response);

		return;
	}

	if (route === "GET /api/state") {
		if (!latestState) {
			sendJson(response, 409, { error: noGameMessage });

			return;
		}

		sendJson(response, 200, latestState);

		return;
	}

	if (route === "PUT /api/state") {
		latestState = await readBody(request);
		sendNoContent(response);

		return;
	}

	if (route === "POST /api/actions") {
		const { action, decision } = await readBody<{
			action: GameActionId;
			decision?: unknown;
		}>(request);

		if (!gameActionIds.includes(action)) {
			sendJson(response, 400, {
				error: `Unknown action ${action}. Use one of: ${gameActionIds.join(", ")}`,
			});

			return;
		}

		await handleCommand(response, {
			type: "action",
			action,
			decision: decision ?? null,
		});

		return;
	}

	if (route === "POST /api/restart") {
		await handleCommand(response, { type: "restart" });

		return;
	}

	const commandResult = url.pathname.match(/^\/api\/commands\/([\w-]+)$/);

	if (request.method === "POST" && commandResult) {
		const result = await readBody(request);
		latestState = (result as { state?: unknown }).state ?? latestState;
		sendNoContent(response, completeCommand(commandResult[1], result) ? 204 : 404);

		return;
	}

	if (route === "POST /api/pilot") {
		startPilot();
		sendJson(response, 202, { running: true });

		return;
	}

	if (route === "DELETE /api/pilot") {
		stopPilot();
		sendJson(response, 202, { running: false });

		return;
	}

	if (request.method === "GET") {
		await sendStaticFile(response, url.pathname);

		return;
	}

	sendJson(response, 404, { error: "Not found" });
});

server.listen(port, () => {
	console.log(`🐢 Turbotuga is ready on http://localhost:${port}`);
});

function shutdown(): void {
	stopPilot();
	game?.end();
	server.close();
	server.closeAllConnections();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
