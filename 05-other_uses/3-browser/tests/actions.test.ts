import assert from "node:assert/strict";
import { test } from "node:test";

import { browserOptions, extractQuotedTexts, extractUrls, type PageState } from "../src/actions.ts";

const blankPage: PageState = { url: "about:blank", title: "", elements: [], canScrollDown: false };

const blogPage: PageState = {
	url: "https://codely.com/blog",
	title: "Blog",
	elements: [
		{ id: 1, role: "link", name: "¿Han muerto los MCPs por culpa de las Skills?", href: "/blog/han-muerto-los-mcps" },
		{ id: 2, role: "button", name: "Aceptar todas" },
		{ id: 3, role: "textbox", name: "Buscar" },
	],
	canScrollDown: true,
};

test("extracts the URLs of the goal with https", () => {
	assert.deepEqual(extractUrls("Ve a la web de codely.com y luego a https://github.com/CodelyTV."), [
		"https://codely.com",
		"https://github.com/CodelyTV",
	]);
});

test("extracts the quoted texts of the goal", () => {
	assert.deepEqual(extractQuotedTexts('Busca "arquitectura hexagonal" y «DDD»'), ["arquitectura hexagonal", "DDD"]);
});

test("only offers to open the URLs of the goal on a blank page", () => {
	assert.deepEqual(
		browserOptions("Ve a codely.com", blankPage).map(({ id }) => id),
		["open https://codely.com"],
	);
});

test("does not offer to open the URL of the current page", () => {
	const options = browserOptions("Ve a codely.com/blog", blogPage).map(({ id }) => id);

	assert.equal(options.includes("open https://codely.com/blog"), false);
});

test("offers to click every link and button, to scroll, to go back and to finish", () => {
	assert.deepEqual(
		browserOptions("Entra en un post sobre MCP", blogPage).map(({ id }) => id),
		["click #1", "click #2", "scroll_down", "go_back", "done"],
	);
});

test("only offers to type the quoted texts of the goal", () => {
	const typeOptions = browserOptions('Busca "MCP"', blogPage).filter(({ action }) => action.type === "type");

	assert.deepEqual(typeOptions, [
		{
			id: 'type #3 "MCP"',
			description: 'Type "MCP" in the text field "Buscar" and press Enter.',
			action: { type: "type", elementId: 3, text: "MCP" },
		},
	]);
});
