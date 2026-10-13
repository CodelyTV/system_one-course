import { createGateway } from "ai";
import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize } from "node:path";

import { BrowserSession, viewport } from "./browser.ts";
import { type PilotEvent, runPilot } from "./pilot.ts";

const port = Number(process.env.PORT ?? 3300);
const modelId = process.env.PILOT_MODEL ?? "typesafe-ai/jev";
const maxSteps = Number(process.env.PILOT_MAX_STEPS ?? 15);
const publicPath = join(import.meta.dirname, "..", "public");

const contentTypes: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
};

const apiKey = process.env.AI_GATEWAY_API_KEY;

if (!apiKey) {
	console.error("AI_GATEWAY_API_KEY is not set. Add it to .env.local.");
	process.exit(1);
}

const model = createGateway({ apiKey }).decisionModel(modelId);
const viewers = new Set<ServerResponse>();
let latestFrame: string | null = null;
let taskEvents: PilotEvent[] = [];
let task: AbortController | null = null;
let taskRun: Promise<void> = Promise.resolve();
let nextStep: (() => void) | null = null;

function sendJson(response: ServerResponse, status: number, body: unknown): void {
	response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	response.end(JSON.stringify(body));
}

function sendEvent(target: ServerResponse, type: string, data: unknown): void {
	target.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

function broadcast(type: string, data: unknown): void {
	for (const viewer of viewers) {
		sendEvent(viewer, type, data);
	}
}

async function readBody<T>(request: IncomingMessage): Promise<T> {
	const chunks: Buffer[] = [];

	for await (const chunk of request) {
		chunks.push(chunk as Buffer);
	}

	return (chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}) as T;
}

const session = await BrowserSession.launch(({ data }) => {
	latestFrame = data;
	broadcast("frame", { data });
});

function connectViewer(request: IncomingMessage, response: ServerResponse): void {
	response.writeHead(200, {
		"content-type": "text/event-stream",
		"cache-control": "no-cache",
		connection: "keep-alive",
	});
	viewers.add(response);
	sendEvent(response, "hello", { model: modelId, maxSteps, viewport, running: task !== null });

	for (const event of taskEvents) {
		sendEvent(response, "pilot", event);
	}

	if (latestFrame) {
		sendEvent(response, "frame", { data: latestFrame });
	}

	const heartbeat = setInterval(() => response.write(": ping\n\n"), 15_000);

	request.on("close", () => {
		clearInterval(heartbeat);
		viewers.delete(response);
	});
}

function emit(event: PilotEvent): void {
	taskEvents.push(event);
	broadcast("pilot", event);
}

function waitForNextStep(signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		nextStep = () => {
			nextStep = null;
			resolve();
		};
		signal.addEventListener("abort", () => reject(signal.reason), { once: true });
	});
}

async function runTask(goal: string, stepByStep: boolean): Promise<void> {
	const controller = new AbortController();
	const { signal } = controller;
	task = controller;
	taskEvents = [];

	try {
		await runPilot({
			goal,
			session,
			model,
			modelId,
			maxSteps,
			signal,
			emit,
			waitForNextStep: stepByStep ? () => waitForNextStep(signal) : undefined,
		});
	} catch (error) {
		emit(
			signal.aborted
				? { type: "finished", status: "stopped" }
				: { type: "finished", status: "error", error: (error as Error).message },
		);
	} finally {
		task = null;
		nextStep = null;
	}
}

async function reset(): Promise<void> {
	task?.abort();
	await taskRun;
	await session.reset();
	taskEvents = [];
	latestFrame = null;
	broadcast("reset", {});
}

async function sendStaticFile(response: ServerResponse, pathname: string): Promise<void> {
	const filePath = join(publicPath, normalize(pathname === "/" ? "/index.html" : pathname));

	if (!filePath.startsWith(publicPath)) {
		sendJson(response, 403, { error: "Forbidden" });

		return;
	}

	try {
		const content = await readFile(filePath);
		response.writeHead(200, {
			"content-type": contentTypes[extname(filePath)] ?? "application/octet-stream",
			"cache-control": "no-cache",
		});
		response.end(content);
	} catch {
		sendJson(response, 404, { error: "Not found" });
	}
}

const server = createServer(async (request, response) => {
	const url = new URL(request.url ?? "/", `http://localhost:${port}`);
	const route = `${request.method} ${url.pathname}`;

	if (route === "GET /api/events") {
		connectViewer(request, response);

		return;
	}

	if (route === "POST /api/tasks") {
		const { goal, stepByStep = false } = await readBody<{ goal?: string; stepByStep?: boolean }>(request);

		if (!goal?.trim()) {
			sendJson(response, 400, { error: "Write a goal for Jev first." });

			return;
		}

		if (task) {
			sendJson(response, 409, { error: "Jev is already working on a goal. Stop it first." });

			return;
		}

		taskRun = runTask(goal.trim(), stepByStep);
		sendJson(response, 202, { running: true });

		return;
	}

	if (route === "POST /api/tasks/next") {
		if (!nextStep) {
			sendJson(response, 409, { error: "Jev is not waiting for the next step." });

			return;
		}

		nextStep();
		sendJson(response, 202, { running: true });

		return;
	}

	if (route === "POST /api/reset") {
		await reset();
		sendJson(response, 202, { running: false });

		return;
	}

	if (route === "DELETE /api/tasks") {
		task?.abort();
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
	console.log(`🧭 Jev Browser is ready on http://localhost:${port}`);
});

async function shutdown(): Promise<void> {
	task?.abort();

	for (const viewer of viewers) {
		viewer.end();
	}

	server.close();
	server.closeAllConnections();
	await session.close();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
