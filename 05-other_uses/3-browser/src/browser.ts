import { type Browser, type CDPSession, chromium, type Page } from "playwright";

import type { BrowserAction, PageElement, PageState } from "./actions.ts";

export const viewport = { width: 1280, height: 656 };

const maxElements = 40;
const settleMs = 1200;
const networkIdleTimeoutMs = 5_000;
const elementIdAttribute = "data-jev-id";
const highlightId = "jev-highlight";

type Frame = { data: string };

export class BrowserSession {
	private readonly browser: Browser;
	private readonly page: Page;
	private readonly cdp: CDPSession;

	private constructor(browser: Browser, page: Page, cdp: CDPSession) {
		this.browser = browser;
		this.page = page;
		this.cdp = cdp;
	}

	static async launch(onFrame: (frame: Frame) => void): Promise<BrowserSession> {
		const browser = await chromium.launch({ headless: process.env.HEADLESS !== "false" });
		const context = await browser.newContext({ viewport, locale: "es-ES" });
		const page = await context.newPage();
		const cdp = await context.newCDPSession(page);

		cdp.on("Page.screencastFrame", async ({ data, sessionId }) => {
			onFrame({ data });
			await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
		});
		await cdp.send("Page.startScreencast", {
			format: "jpeg",
			quality: 70,
			maxWidth: viewport.width,
			maxHeight: viewport.height,
		});

		return new BrowserSession(browser, page, cdp);
	}

	async reset(): Promise<void> {
		await this.page.goto("about:blank");
		await this.page.context().clearCookies();
		await this.cdp.send("Storage.clearDataForOrigin", { origin: "*", storageTypes: "all" }).catch(() => {});
	}

	async readPage(): Promise<PageState> {
		const { elements, canScrollDown } = await this.page.evaluate(
			({ attribute, limit }) => {
				const selector = "a[href], button, input:not([type=hidden]), textarea, [role=button], [role=link]";
				const nameOf = (node: Element) =>
					(
						node.getAttribute("aria-label") ||
						(node as HTMLElement).innerText ||
						node.getAttribute("title") ||
						node.querySelector("img")?.getAttribute("alt") ||
						node.getAttribute("placeholder") ||
						""
					)
						.replace(/\s+/g, " ")
						.trim()
						.slice(0, 80);
				const isVisible = (node: Element) => {
					const rect = node.getBoundingClientRect();

					if (rect.width < 4 || rect.height < 4 || rect.bottom < 0 || rect.top > innerHeight) {
						return false;
					}

					const x = Math.min(Math.max(rect.left + rect.width / 2, 0), innerWidth - 1);
					const y = Math.min(Math.max(rect.top + rect.height / 2, 0), innerHeight - 1);
					const topNode = document.elementFromPoint(x, y);

					return topNode !== null && (node.contains(topNode) || topNode.contains(node));
				};
				const roleOf = (node: Element): "link" | "button" | "textbox" => {
					if (node.matches("input:not([type=button], [type=submit], [type=checkbox], [type=radio]), textarea")) {
						return "textbox";
					}

					return node.matches("a[href], [role=link]") ? "link" : "button";
				};

				document.querySelectorAll(`[${attribute}]`).forEach((node) => node.removeAttribute(attribute));

				const found = new Map<string, { node: Element; role: ReturnType<typeof roleOf>; name: string; href?: string }>();

				for (const node of document.querySelectorAll(selector)) {
					const name = nameOf(node);

					if (!name || !isVisible(node)) {
						continue;
					}

					const role = roleOf(node);
					const link = node.closest("a[href]") as HTMLAnchorElement | null;
					const href = link
						? link.origin === location.origin
							? link.pathname + link.search
							: link.href
						: undefined;
					const key = href ?? `${role}:${name}`;
					const existing = found.get(key);

					if (!existing || existing.name.length < name.length) {
						found.set(key, { node, role, name, href });
					}
				}

				const elements = [...found.values()].slice(0, limit).map(({ node, role, name, href }, index) => {
					node.setAttribute(attribute, String(index + 1));

					return { id: index + 1, role, name, ...(href ? { href } : {}) };
				});

				return {
					elements,
					canScrollDown: scrollY + innerHeight < document.documentElement.scrollHeight - 8,
				};
			},
			{ attribute: elementIdAttribute, limit: maxElements },
		);

		return {
			url: this.page.url(),
			title: await this.page.title(),
			elements: elements as PageElement[],
			canScrollDown,
		};
	}

	async perform(action: BrowserAction): Promise<void> {
		try {
			await this.run(action);
			await this.page.waitForLoadState("domcontentloaded");
			await this.page.waitForLoadState("networkidle", { timeout: networkIdleTimeoutMs }).catch(() => {});
			await this.page.waitForTimeout(settleMs);
		} finally {
			await this.removeHighlight();
		}
	}

	async close(): Promise<void> {
		await this.cdp.detach().catch(() => {});
		await this.browser.close();
	}

	private async run(action: BrowserAction): Promise<void> {
		switch (action.type) {
			case "open":
				await this.page.goto(action.url, { waitUntil: "domcontentloaded" });
				break;
			case "click": {
				const element = this.element(action.elementId);
				await this.highlight(action.elementId);
				await element.evaluate((node) => node.closest("a")?.removeAttribute("target"));
				await element.click({ timeout: 5_000 });
				break;
			}
			case "type": {
				const element = this.element(action.elementId);
				await this.highlight(action.elementId);
				await element.fill(action.text);
				await element.press("Enter");
				break;
			}
			case "scroll_down":
				await this.page.evaluate(() => scrollBy({ top: innerHeight * 0.7, behavior: "smooth" }));
				break;
			case "go_back":
				await this.page.goBack({ waitUntil: "domcontentloaded" });
				break;
			case "done":
				break;
		}
	}

	private element(elementId: number) {
		return this.page.locator(`[${elementIdAttribute}="${elementId}"]`);
	}

	private async highlight(elementId: number): Promise<void> {
		await this.element(elementId).evaluate((node, id) => {
			const rect = node.getBoundingClientRect();
			const box = document.createElement("div");
			box.id = id;
			Object.assign(box.style, {
				position: "fixed",
				left: `${rect.left - 6}px`,
				top: `${rect.top - 6}px`,
				width: `${rect.width + 12}px`,
				height: `${rect.height + 12}px`,
				border: "4px solid #6ef06c",
				borderRadius: "10px",
				boxShadow: "0 0 0 9999px rgba(16, 22, 33, 0.35), 0 0 24px #6ef06c",
				pointerEvents: "none",
				zIndex: "2147483647",
			});
			document.body.append(box);
		}, highlightId);
		await this.page.waitForTimeout(700);
	}

	private async removeHighlight(): Promise<void> {
		await this.page
			.evaluate((id) => document.getElementById(id)?.remove(), highlightId)
			.catch(() => {});
	}
}
