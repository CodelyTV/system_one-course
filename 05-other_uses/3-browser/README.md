# Jev Browser

A web page where you write a goal (for example, "Go to codely.com, accept the cookie banner, then find a blog post about MCP and open it") and a System One model completes it in a real browser, one action at a time.

## Commands

```bash
make start         # installs the dependencies and Chromium if needed and serves the page on http://localhost:3300 (Ctrl+C stops it)
npm run test
npm run typecheck
```

It needs Node.js 24 or later: Node runs the TypeScript files directly. It needs `AI_GATEWAY_API_KEY` in the environment or in `.env.local`.

## How to use it

1. Run `make start` and open http://localhost:3300.
2. Write a goal or choose an example, and click **▶ Run Jev** (or press `⌘ Enter`).
3. **⏭ Step by step** runs only the first step. Then **⏭ Next** runs one more step every time you click it.
4. **⏹ Stop Jev** stops Jev before the next step.
5. **↺ Reset** stops Jev, opens `about:blank` and clears the page to start again.

The page shows the live browser, the request sent to the model in every step (its `state` and its `questions`), the chosen action with the probabilities of the best options and the history of all the decisions.

## How it works

```
page (public/) ⇄ src/server.ts (SSE) ⇄ src/pilot.ts → Jev
                                           ⇅
                                  src/browser.ts (Playwright + Chromium)
```

- `src/browser.ts` launches a headless Chromium with Playwright and sends its screencast frames to the page. Every step, it reads the visible links, buttons and text fields of the page, and it runs the chosen action. Before a click, it highlights the element in the page.
- `src/actions.ts` turns the page into the options of a `choice` question: open a URL of the goal, click an element, type a quoted text of the goal, scroll down, go back or finish. Jev chooses, it does not write: it can only type the texts that are in quotes in the goal.
- `src/pilot.ts` asks `typesafe-ai/jev` with `experimental_decide` (a `choice` question for the action and a `boolean` question to know if the goal is completed) until Jev chooses `done` or it reaches the maximum number of steps.
- `src/server.ts` serves the page, starts and stops the goals and sends the frames and the decisions to the page with Server-Sent Events.

Use `PILOT_MODEL` to try another decision model, `PILOT_MAX_STEPS` to change the maximum number of steps (15) and `HEADLESS=false` to also see the Chromium window.
