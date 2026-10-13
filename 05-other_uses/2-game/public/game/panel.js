import { actionIds } from "./actions.js";

export const actionDisplay = {
	walk_right: { icon: "➡️", label: "Walk", color: "#6ef06c" },
	jump_right: { icon: "🦘", label: "Jump", color: "#a6f2e8" },
	long_jump_right: { icon: "🚀", label: "Long jump", color: "#c3a6ff" },
	jump_up: { icon: "⬆️", label: "Hit block", color: "#f8ef7a" },
};

const outcomeDisplay = {
	coin: "🪙",
	reward: "🎁",
	stomp: "🐞",
	death: "💀",
	checkpoint: "💾",
	flag: "🚩",
};

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
	if (isInline(value)) {
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

export class Panel {
	constructor(root, history) {
		this.root = root;
		this.request = root.querySelector("[data-request]");
		this.windowTitle = root.querySelector("[data-window-title]");
		this.model = root.querySelector("[data-model]");
		this.connection = root.querySelector("[data-connection]");
		this.pilotButton = root.querySelector("[data-pilot-button]");
		this.log = history.querySelector("[data-log]");
		this.stats = history.querySelector("[data-stats]");
		this.entries = [];
		this.previousLines = [];
		this.renderIdle("human");
	}

	setMode(mode) {
		this.root.dataset.mode = mode;

		if (this.entries.length === 0) {
			this.renderIdle(mode);
		}
	}

	setConnected(connected) {
		this.connection.dataset.on = String(connected);
	}

	setPilot(running) {
		this.pilotButton.textContent = running ? "⏸ Pause Jev" : "▶ Play Jev";
		this.pilotButton.dataset.running = String(running);
	}

	clear() {
		this.entries = [];
		this.previousLines = [];
		this.log.replaceChildren();
		this.renderIdle(this.root.dataset.mode);
		this.renderStats();
	}

	renderIdle(mode) {
		const comments =
			mode === "system-one"
				? ["// Waiting for the first request to the model.", "// Play Jev: the pilot calls experimental_decide()", "// with this state and these questions every turn."]
				: ["// You are playing.", "// Switch to System One mode to see the state", "// and the questions that Jev receives every turn."];

		this.windowTitle.textContent = "request.json";
		this.renderCode(comments.map((comment) => `<span class="c">${comment}</span>`));
	}

	renderCode(lines) {
		const code = element("pre", "code");

		lines.forEach((line, index) => {
			const node = element("span", "ln");
			node.innerHTML = line || " ";
			if (this.previousLines.length && this.previousLines[index] !== line) {
				node.classList.add("is-changed");
			}
			code.append(node);
		});

		this.previousLines = lines;
		this.request.replaceChildren(code);
	}

	renderRequest(turn, decision) {
		this.windowTitle.textContent = `turn-${turn} · request.json`;

		if (!decision?.request) {
			this.previousLines = [];
			this.renderCode([`<span class="c">// The MCP client did not send its request.</span>`]);

			return;
		}

		if (decision.model) {
			this.model.textContent = decision.model;
		}

		const { model: _model, ...request } = decision.request;
		this.renderCode(jsonLines(request));
	}

	addDecision({ turn, action, decision, surroundings }) {
		this.renderRequest(turn, decision);

		const entry = { turn, action, decision, outcomes: [] };
		this.entries.at(-1)?.node.classList.remove("is-latest");
		this.entries.push(entry);
		this.log.prepend(this.renderEntry(entry, surroundings));
		this.renderStats();

		return entry;
	}

	renderEntry(entry, surroundings) {
		const display = actionDisplay[entry.action];
		const probabilities = entry.decision?.probabilities;
		const confidence = probabilities?.[entry.action];
		const item = element("li", "entry is-new is-latest");
		item.style.setProperty("--accent", display.color);

		const main = element("div", "entry__main");
		main.append(element("span", "entry__label", display.label), element("span", "entry__seen", surroundings.situation));

		const side = element("div", "entry__side");
		side.append(
			element("span", "entry__confidence", confidence !== undefined ? percent(confidence) : ""),
			element("span", "entry__meta", entry.decision?.latencyMs !== undefined ? `${entry.decision.latencyMs} ms` : ""),
		);

		const row = element("div", "entry__row");
		row.append(element("span", "entry__turn", `#${entry.turn}`), element("span", "entry__icon emoji", display.icon), main, side);
		item.append(row);

		const bars = element("ul", "bars");
		if (probabilities) {
			for (const id of actionIds) {
				bars.append(
					bar(`${actionDisplay[id].icon} ${actionDisplay[id].label}`, probabilities[id] ?? 0, actionDisplay[id].color, id === entry.action ? "is-chosen" : ""),
				);
			}
		}
		if (entry.decision?.danger !== undefined) {
			const danger = bar("⚠️ Danger", entry.decision.danger, null, "bars__danger");
			danger.dataset.level = entry.decision.danger > 0.66 ? "high" : entry.decision.danger > 0.33 ? "medium" : "low";
			bars.append(danger);
		}
		if (bars.childElementCount > 0) {
			item.append(bars);
		}

		entry.node = item;
		setTimeout(() => item.classList.remove("is-new"), 600);

		return item;
	}

	completeDecision(entry, events) {
		const outcomes = events.map(({ type }) => outcomeDisplay[type]).filter(Boolean);
		const latency = entry.decision?.latencyMs !== undefined ? `${entry.decision.latencyMs} ms` : "";
		entry.node.querySelector(".entry__meta").textContent = [outcomes.join(""), latency].filter(Boolean).join(" · ");

		if (events.some(({ type }) => type === "death")) {
			entry.node.classList.add("is-death");
		}
	}

	renderStats() {
		const latencies = this.entries.map(({ decision }) => decision?.latencyMs).filter((value) => value !== undefined);
		const average = latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : null;

		this.stats.textContent = this.entries.length
			? `${this.entries.length} decisions${average !== null ? ` · ${average} ms avg` : ""}`
			: "No decisions yet";
	}
}
