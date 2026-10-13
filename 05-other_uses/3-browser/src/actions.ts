export type PageElement = {
	id: number;
	role: "link" | "button" | "textbox";
	name: string;
	href?: string;
};

export type PageState = {
	url: string;
	title: string;
	elements: PageElement[];
	canScrollDown: boolean;
};

export type BrowserAction =
	| { type: "open"; url: string }
	| { type: "click"; elementId: number }
	| { type: "type"; elementId: number; text: string }
	| { type: "scroll_down" }
	| { type: "go_back" }
	| { type: "done" };

export type BrowserOption = {
	id: string;
	description: string;
	action: BrowserAction;
};

const urlPattern = /\b(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})(\/[^\s,;"'«»]*)?/gi;
const quotedTextPattern = /["“«]([^"”»]+)["”»]/g;

export function extractUrls(goal: string): string[] {
	const urls = [...goal.matchAll(urlPattern)].map(
		([, host, path = ""]) => `https://${host.toLowerCase()}${path.replace(/[.)]+$/, "")}`,
	);

	return [...new Set(urls)];
}

export function extractQuotedTexts(goal: string): string[] {
	return [...new Set([...goal.matchAll(quotedTextPattern)].map(([, text]) => text.trim()))];
}

function isSameUrl(current: string, target: string): boolean {
	const normalize = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

	return normalize(current) === normalize(target);
}

function describeElement(element: PageElement): string {
	if (element.role === "link") {
		return `Click the link "${element.name}"${element.href ? ` that goes to ${element.href}` : ""}.`;
	}

	return `Click the button "${element.name}".`;
}

export function browserOptions(goal: string, page: PageState): BrowserOption[] {
	const options: BrowserOption[] = extractUrls(goal)
		.filter((url) => !isSameUrl(page.url, url))
		.map((url) => ({
			id: `open ${url}`,
			description: `Open the URL ${url} in the browser.`,
			action: { type: "open", url },
		}));

	for (const element of page.elements) {
		if (element.role === "textbox") {
			for (const text of extractQuotedTexts(goal)) {
				options.push({
					id: `type #${element.id} "${text}"`,
					description: `Type "${text}" in the text field "${element.name}" and press Enter.`,
					action: { type: "type", elementId: element.id, text },
				});
			}

			continue;
		}

		options.push({
			id: `click #${element.id}`,
			description: describeElement(element),
			action: { type: "click", elementId: element.id },
		});
	}

	if (page.canScrollDown) {
		options.push({
			id: "scroll_down",
			description: "Scroll down to see more of the current page.",
			action: { type: "scroll_down" },
		});
	}

	if (page.url !== "about:blank") {
		options.push(
			{
				id: "go_back",
				description: "Go back to the previous page.",
				action: { type: "go_back" },
			},
			{
				id: "done",
				description: "Stop. The current page already completes the whole goal.",
				action: { type: "done" },
			},
		);
	}

	return options;
}
