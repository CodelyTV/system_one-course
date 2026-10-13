const stage = document.querySelector("[data-stage]");
const frame = document.querySelector("[data-frame]");
const overlay = document.querySelector("[data-overlay]");
const urlBar = document.querySelector("[data-url]");
const stepBadge = document.querySelector("[data-step]");
const status = document.querySelector("[data-status]");
const connection = document.querySelector("[data-connection]");
const windowTitle = document.querySelector("[data-window-title]");
const modelBadge = document.querySelector("[data-model]");
const request = document.querySelector("[data-request]");
const log = document.querySelector("[data-log]");
const stats = document.querySelector("[data-stats]");
const form = document.querySelector("[data-goal-form]");
const goalInput = document.querySelector("[data-goal]");
const runButton = document.querySelector("[data-run]");
const stepButton = document.querySelector("[data-step-button]");
const resetButton = document.querySelector("[data-reset]");

const actionDisplay = {
	open: { icon: "🌐", color: "#a6f2e8" },
	click: { icon: "👆", color: "#6ef06c" },
	type: { icon: "⌨️", color: "#f8ef7a" },
	scroll_down: { icon: "⬇️", color: "#c3a6ff" },
	go_back: { icon: "↩️", color: "#f39a3d" },
	done: { icon: "✅", color: "#6ef06c" },
};

const finishedDisplay = {
	done: "done",
	stopped: "stopped",
	max_steps: "too many steps",
	no_options: "no options",
	error: "error",
};

const maxBars = 4;

let maxSteps = 0;
let running = false;
let stepByStep = false;
let paused = false;
let hasTask = false;
let entries = [];
let previousLines = [];

function element(tag, className, text) {
	const node = document.createElement(tag);
	if (className) {
		node.className = className;
	}
	if (text !== undefined) {
		node.textContent = text;
	}

	return node;
}

function percent(value) {
	return `${Math.round(value * 100)}%`;
}

function escapeHtml(text) {
	return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function highlightValue(value) {
	if (typeof value === "string") {
		return `<span class="s">${escapeHtml(JSON.stringify(value))}</span>`;
	}

	if (typeof value === "number") {
		return `<span class="n">${value}</span>`;
	}

	if (value === null || typeof value === "boolean") {
		return `<span class="b">${value}</span>`;
	}

	if (Array.isArray(value)) {
		return `[${value.map(highlightValue).join(", ")}]`;
	}

	const entries = Object.entries(value).map(([key, item]) => `<span class="k">"${escapeHtml(key)}"</span>: ${highlightValue(item)}`);

	return entries.length ? `{ ${entries.join(", ")} }` : "{}";
}

function isInline(value) {
	return typeof value !== "object" || value === null || Object.keys(value).length === 0;
}

function jsonLines(value, indent = "", prefix = "", suffix = "") {
	if (Array.isArray(value) && value.length > 0) {
		const lines = [`${indent}${prefix}[`];
		value.forEach((item, index) => lines.push(...jsonLines(item, `${indent}  `, "", index < value.length - 1 ? "," : "")));
		lines.push(`${indent}]${suffix}`);

		return lines;
	}

	if (isInline(value) || Array.isArray(value)) {
		return [`${indent}${prefix}${highlightValue(value)}${suffix}`];
	}

	const entries = Object.entries(value);
	const lines = [`${indent}${prefix}{`];

	entries.forEach(([key, item], index) => {
		lines.push(...jsonLines(item, `${indent}  `, `<span class="k">"${escapeHtml(key)}"</span>: `, index < entries.length - 1 ? "," : ""));
	});
	lines.push(`${indent}}${suffix}`);

	return lines;
}

function renderCode(lines) {
	const code = element("pre", "code");

	lines.forEach((line, index) => {
		const node = element("span", "ln");
		node.innerHTML = line || " ";
		if (previousLines.length && previousLines[index] !== line) {
			node.classList.add("is-changed");
		}
		code.append(node);
	});

	previousLines = lines;
	request.replaceChildren(code);
}

function renderIdle() {
	windowTitle.textContent = "request.json";
	previousLines = [];
	renderCode(
		[
			"// Waiting for a goal.",
			"// Every step, the server reads the page with Playwright,",
			"// turns its links and buttons into options",
			"// and asks Jev with experimental_decide().",
		].map((comment) => `<span class="c">${comment}</span>`),
	);
}

function actionType(optionId) {
	return optionId.split(" ")[0];
}

function optionLabel(option) {
	const type = actionType(option.id);
	const quoted = option.description.match(/"(.+?)"/)?.[1];

	if (type === "open") {
		return `Open ${option.id.slice("open ".length)}`;
	}

	if (type === "click") {
		return `Click "${quoted}"`;
	}

	if (type === "type") {
		return `Type "${quoted}"`;
	}

	return { scroll_down: "Scroll down", go_back: "Go back", done: "Done" }[type];
}

function bar(label, value, accent, className = "") {
	const item = element("li", className);
	if (accent) {
		item.style.setProperty("--accent", accent);
	}
	const track = element("span", "bars__track");
	const fill = element("span", "bars__fill");
	track.append(fill);
	item.append(element("span", null, label), track, element("span", "bars__value", percent(value)));
	requestAnimationFrame(() => {
		fill.style.width = percent(value);
	});

	return item;
}

function renderStats() {
	const latencies = entries.map(({ latencyMs }) => latencyMs);
	const average = latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : null;

	stats.textContent = entries.length ? `${entries.length} decisions · ${average} ms avg` : "No decisions yet";
}

function addDecision(event) {
	windowTitle.textContent = `step-${event.step} · request.json`;
	renderCode(jsonLines(event.request));

	const chosen = event.options.find(({ id }) => id === event.choice);
	const display = actionDisplay[actionType(event.choice)];
	const item = element("li", "entry is-new is-latest");
	item.style.setProperty("--accent", display.color);

	const main = element("div", "entry__main");
	main.append(element("span", "entry__label", optionLabel(chosen)), element("span", "entry__seen", event.request.state.currentPage.url));

	const side = element("div", "entry__side");
	side.append(
		element("span", "entry__confidence", percent(event.probabilities[event.choice] ?? 0)),
		element("span", "entry__meta", `${event.latencyMs} ms`),
	);

	const row = element("div", "entry__row");
	row.append(element("span", "entry__turn", `#${event.step}`), element("span", "entry__icon emoji", display.icon), main, side);
	item.append(row);

	const bars = element("ul", "bars");
	const ranked = event.options
		.map((option) => ({ option, probability: event.probabilities[option.id] ?? 0 }))
		.sort((left, right) => right.probability - left.probability)
		.slice(0, maxBars);

	for (const { option, probability } of ranked) {
		const accent = actionDisplay[actionType(option.id)].color;
		bars.append(bar(`${actionDisplay[actionType(option.id)].icon} ${optionLabel(option)}`, probability, accent, option.id === event.choice ? "is-chosen" : ""));
	}
	bars.append(bar(`🏁 Goal completed (${event.options.length} options)`, event.completed, null, "bars__completed"));
	item.append(bars);

	log.querySelector(".is-latest")?.classList.remove("is-latest");
	log.prepend(item);
	setTimeout(() => item.classList.remove("is-new"), 600);

	entries.push({ step: event.step, latencyMs: event.latencyMs, node: item, choice: event.choice });
	renderStats();
}

function completeDecision(event) {
	const entry = entries.find(({ step }) => step === event.step);

	if (!entry) {
		return;
	}

	const meta = entry.node.querySelector(".entry__meta");
	meta.textContent = `${event.error ? "❌" : "✓"} · ${meta.textContent}`;

	if (event.error) {
		entry.node.classList.add("is-error");
		entry.node.title = event.error;
	}
}

function setStatus(value, label = value) {
	status.dataset.status = value;
	status.textContent = label;
}

function renderControls() {
	runButton.textContent = running ? "⏹ Stop Jev" : "▶ Run Jev";
	runButton.dataset.running = String(running);
	stepButton.textContent = running ? "⏭ Next" : "⏭ Step by step";
	stepButton.disabled = running && !(stepByStep && paused);
	goalInput.disabled = running;
}

function setRunning(value, isStepByStep = stepByStep) {
	running = value;
	stepByStep = value && isStepByStep;
	paused = false;
	renderControls();
}

function setPaused(value) {
	paused = value;
	renderControls();
}

function resetView() {
	hasTask = false;
	entries = [];
	log.replaceChildren();
	renderIdle();
	renderStats();
	goalInput.value = "";
	urlBar.textContent = "about:blank";
	stepBadge.textContent = "";
	frame.removeAttribute("src");
	overlay.hidden = false;
	setStatus("idle");
	setRunning(false);
}

function handlePilotEvent(event) {
	switch (event.type) {
		case "started":
			hasTask = true;
			entries = [];
			log.replaceChildren();
			renderIdle();
			renderStats();
			goalInput.value = event.goal;
			modelBadge.textContent = event.model;
			stepBadge.textContent = "";
			setStatus("running", "thinking…");
			setRunning(true, event.stepByStep);
			break;
		case "paused":
			setStatus("paused", `step ${event.step} · waiting for next`);
			setPaused(true);
			break;
		case "thinking":
			setPaused(false);
			urlBar.textContent = event.page.url;
			stepBadge.textContent = `step ${event.step}/${maxSteps}`;
			setStatus("running", `step ${event.step} · thinking…`);
			break;
		case "decision":
			addDecision(event);
			setStatus("running", `step ${event.step} · ${actionType(event.choice).replace("_", " ")}`);
			break;
		case "performed":
			urlBar.textContent = event.url;
			completeDecision(event);
			break;
		case "finished":
			if (event.status === "done") {
				entries.at(-1)?.node.classList.add("is-done");
			}
			setStatus(event.status, finishedDisplay[event.status]);
			setRunning(false);
			break;
	}
}

function connect() {
	const events = new EventSource("/api/events");

	events.addEventListener("open", () => {
		connection.dataset.on = "true";
	});
	events.addEventListener("error", () => {
		connection.dataset.on = "false";
	});
	events.addEventListener("hello", (event) => {
		const hello = JSON.parse(event.data);
		maxSteps = hello.maxSteps;
		modelBadge.textContent = hello.model;
		setRunning(hello.running);
	});
	events.addEventListener("pilot", (event) => handlePilotEvent(JSON.parse(event.data)));
	events.addEventListener("reset", resetView);
	events.addEventListener("frame", (event) => {
		frame.src = `data:image/jpeg;base64,${JSON.parse(event.data).data}`;
		if (hasTask) {
			overlay.hidden = true;
		}
	});
}

async function send(method, path, body) {
	const response = await fetch(path, {
		method,
		headers: { "content-type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!response.ok) {
		setStatus("error", (await response.json()).error);
	}
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	if (running) {
		await send("DELETE", "/api/tasks");

		return;
	}

	await send("POST", "/api/tasks", { goal: goalInput.value });
});

stepButton.addEventListener("click", async () => {
	if (!running) {
		await send("POST", "/api/tasks", { goal: goalInput.value, stepByStep: true });

		return;
	}

	stepButton.disabled = true;
	await send("POST", "/api/tasks/next");
});

resetButton.addEventListener("click", () => send("POST", "/api/reset"));

goalInput.addEventListener("keydown", (event) => {
	if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
		form.requestSubmit();
	}
});

document.querySelectorAll("[data-example]").forEach((button) => {
	button.addEventListener("click", () => {
		if (!running) {
			goalInput.value = button.dataset.example;
			goalInput.focus();
		}
	});
});

function fitStage() {
	const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
	stage.style.setProperty("--scale", String(scale));
}

window.addEventListener("resize", fitStage);
fitStage();
renderIdle();
connect();
