const state = {
	conversations: [],
	status: "open",
	view: { type: "all" },
	search: "",
	selectedId: null,
};

const elements = {
	app: document.querySelector(".app"),
	views: document.getElementById("views"),
	teammates: document.getElementById("teammates"),
	tags: document.getElementById("tags"),
	listTitle: document.getElementById("list-title"),
	listCount: document.getElementById("list-count"),
	statusFilter: document.getElementById("status-filter"),
	search: document.getElementById("search"),
	conversations: document.getElementById("conversations"),
	conversation: document.getElementById("conversation"),
	details: document.getElementById("details"),
};

const avatarColors = [
	"#334bfa",
	"#e5484d",
	"#2fa36b",
	"#f5a524",
	"#8e4ec6",
	"#0091ff",
	"#d6409f",
	"#12a594",
];

const channelLabels = { chat: "Chat", email: "Email", whatsapp: "WhatsApp" };

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function initials(name) {
	return name
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

function avatar(name, modifier = "") {
	const color =
		avatarColors[
			[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
				avatarColors.length
		];

	return `<span class="avatar ${modifier}" style="background:${color}">${escapeHtml(initials(name))}</span>`;
}

function timeAgo(isoDate) {
	const minutes = Math.round(
		(Date.now() - new Date(isoDate).getTime()) / 60000,
	);

	if (minutes < 1) {
		return "now";
	}
	if (minutes < 60) {
		return `${minutes}m`;
	}
	if (minutes < 60 * 24) {
		return `${Math.round(minutes / 60)}h`;
	}

	return `${Math.round(minutes / (60 * 24))}d`;
}

function formatDateTime(isoDate) {
	return new Intl.DateTimeFormat("en-GB", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(isoDate));
}

function formatDay(isoDate) {
	return new Intl.DateTimeFormat("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
	}).format(new Date(isoDate));
}

function lastMessage(conversation) {
	return conversation.messages.at(-1);
}

function isWaitingForReply(conversation) {
	return (
		conversation.status !== "closed" &&
		lastMessage(conversation)?.author === "customer"
	);
}

function matchesView(conversation, view) {
	if (view.type === "unassigned") {
		return conversation.assignee === null;
	}
	if (view.type === "waiting") {
		return isWaitingForReply(conversation);
	}
	if (view.type === "vip") {
		return conversation.customer.segment === "vip";
	}
	if (view.type === "teammate") {
		return conversation.assignee === view.value;
	}
	if (view.type === "tag") {
		return conversation.tags.includes(view.value);
	}

	return true;
}

function matchesStatus(conversation) {
	return state.status === "all" || conversation.status === state.status;
}

function matchesSearch(conversation) {
	if (!state.search) {
		return true;
	}

	const haystack = [
		conversation.id,
		conversation.subject,
		conversation.customer.name,
		conversation.customer.email,
		conversation.orderId ?? "",
		...conversation.messages.map((message) => message.body),
	]
		.join(" ")
		.toLowerCase();

	return haystack.includes(state.search.toLowerCase());
}

function visibleConversations() {
	return state.conversations.filter(
		(conversation) =>
			matchesStatus(conversation) &&
			matchesView(conversation, state.view) &&
			matchesSearch(conversation),
	);
}

function viewLabel(view) {
	const labels = {
		all: "All conversations",
		unassigned: "Unassigned",
		waiting: "Waiting for reply",
		vip: "VIP customers",
	};

	return labels[view.type] ?? view.value;
}

function sameView(a, b) {
	return a.type === b.type && a.value === b.value;
}

function inboxLink(view, label, icon = "") {
	const count = state.conversations.filter(
		(conversation) =>
			matchesStatus(conversation) && matchesView(conversation, view),
	).length;
	const active = sameView(view, state.view) ? " inbox-link--active" : "";

	return `<button class="inbox-link${active}" data-view='${escapeHtml(JSON.stringify(view))}'>${icon}<span>${escapeHtml(label)}</span><span class="inbox-link__count">${count}</span></button>`;
}

function renderInboxes() {
	const views = [
		{ type: "all" },
		{ type: "unassigned" },
		{ type: "waiting" },
		{ type: "vip" },
	];
	const teammates = [
		...new Set(
			state.conversations
				.map((conversation) => conversation.assignee)
				.filter(Boolean),
		),
	].sort();
	const tags = [
		...new Set(
			state.conversations.flatMap((conversation) => conversation.tags),
		),
	].sort();

	elements.views.innerHTML = views
		.map((view) => inboxLink(view, viewLabel(view)))
		.join("");
	elements.teammates.innerHTML = teammates
		.map((teammate) =>
			inboxLink(
				{ type: "teammate", value: teammate },
				teammate,
				avatar(teammate, "avatar--small"),
			),
		)
		.join("");
	elements.tags.innerHTML = tags
		.map((tag) => inboxLink({ type: "tag", value: tag }, `#${tag}`))
		.join("");
}

function renderList() {
	const conversations = visibleConversations();

	elements.listTitle.textContent = viewLabel(state.view);
	elements.listCount.textContent = `${conversations.length} conversations`;

	if (conversations.length === 0) {
		elements.conversations.innerHTML = `<li class="list__empty">No conversations here. Nice work! 🎉</li>`;

		return;
	}

	elements.conversations.innerHTML = conversations
		.map((conversation) => {
			const message = lastMessage(conversation);
			const classes = [
				"card",
				conversation.id === state.selectedId ? "card--active" : "",
				isWaitingForReply(conversation) ? "card--waiting" : "",
			].join(" ");
			const prefix = message.author === "agent" ? "You: " : "";

			return `<li class="${classes}" data-id="${escapeHtml(conversation.id)}">
				${avatar(conversation.customer.name)}
				<div>
					<div class="card__top">
						<span class="card__name">${escapeHtml(conversation.customer.name)}</span>
						<span class="card__time">${timeAgo(conversation.updatedAt)}</span>
					</div>
					<div class="card__subject">${escapeHtml(conversation.subject)}</div>
					<div class="card__preview">${escapeHtml(prefix + message.body)}</div>
					<div class="card__meta">
						<span class="chip">${channelLabels[conversation.channel]}</span>
						${conversation.customer.segment === "vip" ? `<span class="chip chip--vip">VIP</span>` : ""}
						${state.status === "all" ? `<span class="chip chip--${conversation.status}">${conversation.status}</span>` : ""}
					</div>
				</div>
			</li>`;
		})
		.join("");
}

function renderThread(conversation) {
	let currentDay = "";

	return conversation.messages
		.map((message) => {
			const day = formatDay(message.sentAt);
			const separator =
				day !== currentDay
					? `<div class="thread__day">${escapeHtml(day)}</div>`
					: "";
			currentDay = day;

			return `${separator}<div class="message message--${message.author}">
				${avatar(message.authorName, "avatar--small")}
				<div>
					<div class="message__bubble">${escapeHtml(message.body)}</div>
					<div class="message__meta">${escapeHtml(message.authorName)} · ${formatDateTime(message.sentAt)}</div>
				</div>
			</div>`;
		})
		.join("");
}

function renderConversation() {
	const conversation = state.conversations.find(
		(item) => item.id === state.selectedId,
	);

	if (!conversation) {
		elements.conversation.innerHTML = `<div class="conversation__empty">Select a conversation</div>`;
		elements.details.innerHTML = "";

		return;
	}

	elements.conversation.innerHTML = `
		<header class="conversation__header">
			<button class="button back-button" hidden>←</button>
			<h2 class="conversation__subject">${escapeHtml(conversation.subject)}</h2>
			<span class="chip chip--${conversation.status}">${conversation.status}</span>
			<div class="conversation__actions">
				<button class="button">Snooze</button>
				<button class="button button--primary">Close</button>
			</div>
		</header>
		<div class="thread">${renderThread(conversation)}</div>
		<form class="composer">
			<div class="composer__tabs">
				<span class="composer__tab composer__tab--active">Reply</span>
				<span class="composer__tab">Note</span>
			</div>
			<textarea placeholder="Reply to ${escapeHtml(conversation.customer.name)}…"></textarea>
			<div class="composer__footer"><button class="button button--primary" type="submit">Send</button></div>
		</form>`;

	const thread = elements.conversation.querySelector(".thread");
	thread.scrollTop = thread.scrollHeight;

	if (window.matchMedia("(max-width: 900px)").matches) {
		const backButton = elements.conversation.querySelector(".back-button");
		backButton.hidden = false;
		backButton.addEventListener("click", () => {
			location.hash = "#/";
		});
	}

	renderDetails(conversation);
}

function attribute(label, value) {
	return `<div class="attribute"><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`;
}

function renderDetails(conversation) {
	const { customer } = conversation;
	const lifetimeValue = new Intl.NumberFormat("es-ES", {
		style: "currency",
		currency: "EUR",
	}).format(customer.lifetimeValue);

	elements.details.innerHTML = `
		<div class="details__customer">
			${avatar(customer.name)}
			<div>
				<p class="details__name">${escapeHtml(customer.name)}</p>
				<div class="details__email">${escapeHtml(customer.email)}</div>
			</div>
		</div>
		<section class="details__section">
			<h3>Conversation</h3>
			<dl>
				${attribute("ID", escapeHtml(conversation.id))}
				${attribute("Assignee", escapeHtml(conversation.assignee ?? "Unassigned"))}
				${attribute("Channel", channelLabels[conversation.channel])}
				${attribute("Order", escapeHtml(conversation.orderId ?? "—"))}
				${attribute("Started", formatDateTime(conversation.createdAt))}
				${attribute("Last activity", formatDateTime(conversation.updatedAt))}
			</dl>
		</section>
		<section class="details__section">
			<h3>Customer</h3>
			<dl>
				${attribute("Segment", customer.segment === "vip" ? `<span class="chip chip--vip">VIP</span>` : escapeHtml(customer.segment))}
				${attribute("Location", escapeHtml(customer.location))}
				${attribute("Lifetime value", lifetimeValue)}
			</dl>
		</section>
		<section class="details__section">
			<h3>Tags</h3>
			<div class="tags">${conversation.tags.map((tag) => `<span class="chip">#${escapeHtml(tag)}</span>`).join("") || "—"}</div>
		</section>`;
}

function render() {
	elements.app.dataset.view = state.selectedId ? "conversation" : "list";
	renderInboxes();
	renderList();
	renderConversation();
}

function selectFromHash() {
	state.selectedId = location.hash.replace(/^#\/?/, "") || null;
	render();
}

elements.views.parentElement.addEventListener("click", (event) => {
	const link = event.target.closest(".inbox-link");

	if (!link) {
		return;
	}

	state.view = JSON.parse(link.dataset.view);
	render();
});

elements.conversations.addEventListener("click", (event) => {
	const card = event.target.closest(".card");

	if (card) {
		location.hash = `#/${card.dataset.id}`;
	}
});

elements.conversation.addEventListener("submit", (event) => {
	event.preventDefault();
});

elements.statusFilter.addEventListener("change", () => {
	state.status = elements.statusFilter.value;
	render();
});

elements.search.addEventListener("input", () => {
	state.search = elements.search.value.trim();
	renderList();
});

window.addEventListener("hashchange", selectFromHash);

state.conversations = await (await fetch("/api/conversations")).json();
selectFromHash();
