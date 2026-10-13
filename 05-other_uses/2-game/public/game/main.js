import { ActionRun, isActionSettled, observe } from "./actions.js";
import { Sound } from "./audio.js";
import { createLevel } from "./level.js";
import { actionDisplay, Panel } from "./panel.js";
import { Effects, Renderer } from "./render.js";
import { loadTurbotuga, palette } from "./sprites.js";
import { createWorld, drainEvents, idleInput, isFinished, stepWorld } from "./world.js";

const fixedStep = 1 / 120;
const decisionShowTime = 0.45;

const canvas = document.querySelector("#game");
const overlays = {
	title: document.querySelector("[data-overlay='title']"),
	waiting: document.querySelector("[data-overlay='waiting']"),
	result: document.querySelector("[data-overlay='result']"),
};
const panel = new Panel(document.querySelector("[data-panel]"), document.querySelector(".history"));
const stage = document.querySelector("[data-stage]");
const sound = new Sound();
const keys = new Set();

await Promise.all([
	document.fonts.load("12px 'Press Start 2P'"),
	document.fonts.load("bold 12px 'JetBrains Mono'"),
]).catch(() => {});

const turbotuga = await loadTurbotuga("/turbotuga.png", 50);
const renderer = new Renderer(canvas, turbotuga);

const game = {
	mode: "title",
	world: createWorld(createLevel()),
	effects: new Effects(),
	time: 0,
	turn: 0,
	bumps: new Map(),
	bubble: null,
	command: null,
	pilotRunning: false,
};

function scene() {
	return {
		time: game.time,
		effects: game.effects,
		bumps: game.bumps,
		bubble: game.bubble,
		mode: game.mode === "system-one" ? "system-one" : "human",
		turn: game.turn,
	};
}

function surroundings() {
	const { progressPercent: _progress, ...rest } = observe(game.world);

	return rest;
}

function snapshot() {
	const world = game.world;

	return {
		mode: game.mode,
		status: world.status,
		lives: world.lives,
		score: world.score,
		coins: world.coins,
		turn: game.turn,
		progressPercent: observe(world).progressPercent,
		surroundings: surroundings(),
	};
}

let lastPublished = "";

function publishState() {
	const body = JSON.stringify(snapshot());

	if (body === lastPublished) {
		return;
	}

	lastPublished = body;
	fetch("/api/state", { method: "PUT", body, headers: { "content-type": "application/json" } }).catch(() => {});
}

function showOverlay(name) {
	for (const [key, overlay] of Object.entries(overlays)) {
		overlay.hidden = key !== name;
	}
}

function resetWorld() {
	game.world = createWorld(createLevel());
	game.effects = new Effects();
	game.bumps = new Map();
	game.bubble = null;
	game.turn = 0;
	renderer.follow(game.world, 0, true);
}

function startHuman() {
	sound.unlock();
	resetWorld();
	game.mode = "human";
	panel.setMode("human");
	panel.clear();
	showOverlay(null);
	canvas.focus();
}

function startSystemOne() {
	sound.unlock();
	resetWorld();
	game.mode = "system-one";
	panel.setMode("system-one");
	panel.clear();
	showOverlay("waiting");
	publishState();
}

function takeControl() {
	if (game.mode === "title" || isFinished(game.world)) {
		startSystemOne();

		return;
	}

	game.mode = "system-one";
	panel.setMode("system-one");
	showOverlay(game.turn === 0 && !game.pilotRunning ? "waiting" : null);
	game.bubble = waitingBubble();
	publishState();
}

function waitingBubble() {
	if (game.world.status !== "playing") {
		return null;
	}

	return game.pilotRunning
		? { thinking: true, dots: true, text: "Thinking", icon: "🧠", color: "#8a96c4", since: game.time }
		: { thinking: true, text: "Paused", icon: "⏸️", color: "#f8ef7a", since: game.time };
}

function backToTitle() {
	game.mode = "title";
	resetWorld();
	panel.setMode("human");
	panel.clear();
	showOverlay("title");
}

function showResult() {
	const won = game.world.status === "won";
	const overlay = overlays.result;
	overlay.dataset.result = won ? "won" : "lost";
	overlay.querySelector("[data-result-title]").textContent = won ? "Deployed to production!" : "Build failed";
	overlay.querySelector("[data-result-icon]").textContent = won ? "🚀" : "💥";
	overlay.querySelector("[data-result-text]").textContent = won
		? `Turbotuga shipped the code with ${game.world.score} points and ${game.world.coins} coins.`
		: `The bugs won this time. Score: ${game.world.score}.`;
	overlay.querySelector("[data-result-who]").textContent =
		game.mode === "system-one" ? `Played by ${panel.model.textContent} in ${game.turn} turns.` : "Played by you.";
	showOverlay("result");
}

function handleEvents(events) {
	const player = game.world.player;
	const centerX = player.x + player.width / 2;

	for (const event of events) {
		switch (event.type) {
			case "jump":
				sound.play(event.long ? "longJump" : "jump");
				game.effects.dust(centerX, player.y + player.height);
				break;
			case "land":
				if (event.airTime > 0.25) {
					game.effects.dust(centerX, player.y + player.height);
				}
				break;
			case "coin":
				sound.play("coin");
				game.effects.burst(event.x, event.y, [palette.gold, "#fff3b0"], 10, { speed: 120, gravity: 200, size: 3, life: 0.5 });
				game.effects.popup(event.x, event.y - 14, "+50", palette.gold);
				break;
			case "reward": {
				sound.play("reward");
				game.bumps.set(`${event.column}:${event.row}`, game.time);
				const x = event.column * 32 + 16;
				const y = event.row * 32 - 6;
				game.effects.burst(x, y, [palette.gold, palette.lime, palette.cyan], 18, { speed: 220, size: 4 });
				game.effects.popup(x, y - 12, "+{ } 200", palette.gold);
				break;
			}
			case "bump":
				sound.play("bump");
				game.bumps.set(`${event.column}:${event.row}`, game.time);
				break;
			case "stomp":
				sound.play("stomp");
				game.effects.burst(event.x, event.y + 10, [palette.red, "#ffffff", palette.lime], 14, { speed: 200 });
				game.effects.popup(event.x, event.y - 8, "bug fixed ✓", palette.lime);
				break;
			case "death":
				sound.play("death");
				game.effects.shake = 1;
				game.effects.popup(centerX, player.y - 10, event.cause === "spikes" ? "merge conflict!" : event.cause === "gap" ? "404!" : "bug!", palette.red);
				break;
			case "checkpoint":
				sound.play("checkpoint");
				game.effects.popup(event.column * 32 + 16, 330, "💾 commit saved", palette.lime);
				game.effects.burst(event.column * 32 + 40, 380, [palette.lime, palette.cyan], 20, { speed: 200 });
				break;
			case "flag":
				sound.play("win");
				game.effects.popup(centerX, player.y - 20, `+${event.bonus}`, palette.lime);
				break;
			case "won":
				for (let index = 0; index < 5; index++) {
					setTimeout(() => {
						game.effects.burst(renderer.cameraX + 200 + Math.random() * 560, 120 + Math.random() * 140, [palette.lime, palette.cyan, palette.pink, palette.gold], 40, { speed: 260, gravity: 260, life: 1.4 });
					}, index * 260);
				}
				break;
			default:
				break;
		}
	}
}

function humanInput() {
	return {
		left: keys.has("ArrowLeft") || keys.has("KeyA"),
		right: keys.has("ArrowRight") || keys.has("KeyD"),
		jump: keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW"),
		run: keys.has("ShiftLeft") || keys.has("ShiftRight"),
	};
}

function systemOneInput() {
	const command = game.command;

	if (!command || game.time < command.startsAt) {
		return idleInput;
	}

	command.run ??= new ActionRun(game.world, command.action);

	return command.run.done ? idleInput : command.run.next(fixedStep);
}

function shouldSimulate() {
	if (game.mode === "human") {
		return true;
	}

	if (game.mode !== "system-one") {
		return false;
	}

	return game.world.status !== "playing" || (game.command && game.time >= game.command.startsAt);
}

function update(dt) {
	game.time += dt;

	if (shouldSimulate() && !isFinished(game.world)) {
		const wasFinished = isFinished(game.world);
		stepWorld(game.world, game.mode === "human" ? humanInput() : systemOneInput(), dt);
		const events = drainEvents(game.world);
		handleEvents(events);
		game.command?.events.push(...events);

		if (!wasFinished && isFinished(game.world)) {
			setTimeout(showResult, 900);
		}
	}

	const command = game.command;
	if (command?.run && isActionSettled(command.run, game.world)) {
		finishCommand(command);
	}

	game.effects.update(dt);
	renderer.follow(game.world, dt);
}

async function reply(id, body) {
	await fetch(`/api/commands/${id}`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	}).catch(() => {});
}

function summarize(events) {
	return events
		.filter(({ type }) => !["jump", "land"].includes(type))
		.map(({ type, cause }) => (cause ? { type, cause } : { type }));
}

function finishCommand(command) {
	game.command = null;
	const events = summarize(command.events);
	panel.completeDecision(command.entry, events);
	game.bubble = waitingBubble();
	reply(command.id, { events, state: snapshot() });
	publishState();
}

function startCommand({ id, action, decision }) {
	if (game.mode !== "system-one") {
		takeControl();
	}

	showOverlay(null);

	if (game.command || isFinished(game.world)) {
		reply(id, { events: [], state: snapshot() });

		return;
	}

	game.turn += 1;
	const display = actionDisplay[action];
	const confidence = decision?.probabilities?.[action];
	const entry = panel.addDecision({ turn: game.turn, action, decision, surroundings: surroundings() });

	sound.play("decision");
	game.bubble = {
		thinking: false,
		icon: display.icon,
		text: confidence !== undefined ? `${display.label} ${Math.round(confidence * 100)}%` : display.label,
		color: display.color,
		since: game.time,
		until: game.time + decisionShowTime + 0.9,
	};
	game.command = { id, action, entry, events: [], run: null, startsAt: game.time + decisionShowTime };
}

function restartFromCommand({ id }) {
	startSystemOne();
	showOverlay(null);
	game.bubble = waitingBubble();
	reply(id, { events: [], state: snapshot() });
}

function connect() {
	const events = new EventSource("/api/events");

	events.addEventListener("open", () => {
		panel.setConnected(true);
		lastPublished = "";
		publishState();
	});
	events.addEventListener("error", () => panel.setConnected(false));
	events.addEventListener("pilot", (event) => {
		game.pilotRunning = JSON.parse(event.data).running;
		panel.setPilot(game.pilotRunning);
		document.body.dataset.pilot = String(game.pilotRunning);

		if (game.mode === "system-one" && !game.command) {
			game.bubble = waitingBubble();
			showOverlay(game.turn === 0 && !game.pilotRunning && !isFinished(game.world) ? "waiting" : overlays.result.hidden ? null : "result");
		}
	});
	events.addEventListener("replaced", () => {
		events.close();
		panel.setConnected(false);
	});
	events.addEventListener("command", (event) => {
		const command = JSON.parse(event.data);

		if (command.type === "restart") {
			restartFromCommand(command);
		} else {
			startCommand(command);
		}
	});
}

function playPilot() {
	sound.unlock();
	takeControl();
	fetch("/api/pilot", { method: "POST" }).catch(() => {});
}

function pausePilot() {
	fetch("/api/pilot", { method: "DELETE" }).catch(() => {});
}

document.addEventListener("click", (event) => {
	const action = event.target.closest("[data-action]")?.dataset.action;

	switch (action) {
		case "play-human":
			startHuman();
			break;
		case "play-system-one":
			startSystemOne();
			break;
		case "start-pilot":
			if (!game.pilotRunning) {
				playPilot();
			}
			break;
		case "toggle-pilot":
			if (game.pilotRunning) {
				pausePilot();
			} else {
				playPilot();
			}
			break;
		case "again":
			if (game.mode === "system-one") {
				startSystemOne();
			} else {
				startHuman();
			}
			break;
		case "menu":
			backToTitle();
			break;
		case "mute":
			event.target.closest("[data-action]").textContent = sound.toggle() ? "🔇" : "🔊";
			break;
		default:
			break;
	}
});

const gameKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"]);

window.addEventListener("keydown", (event) => {
	if (gameKeys.has(event.code) && game.mode === "human") {
		event.preventDefault();
	}

	if (event.code === "Escape" && game.mode !== "title") {
		backToTitle();
	}

	if (game.mode === "title" && event.code === "Enter") {
		startHuman();
	}

	keys.add(event.code);
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => keys.clear());

function fitStage() {
	const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
	stage.style.setProperty("--scale", String(scale));
	renderer.resize(canvas.getBoundingClientRect().width / 960);
}

let previous = performance.now();
let accumulator = 0;

function advance(now, maxStep) {
	accumulator += Math.min(maxStep, (now - previous) / 1000);
	previous = now;

	while (accumulator >= fixedStep) {
		update(fixedStep);
		accumulator -= fixedStep;
	}
}

function frame(now) {
	advance(now, 0.1);
	renderer.draw(game.world, scene());
	requestAnimationFrame(frame);
}

setInterval(() => {
	const now = performance.now();

	if (now - previous > 200) {
		advance(now, 0.5);
	}
}, 250);

window.addEventListener("resize", fitStage);
fitStage();

setInterval(publishState, 500);
panel.setPilot(false);
showOverlay("title");
connect();
requestAnimationFrame(frame);
