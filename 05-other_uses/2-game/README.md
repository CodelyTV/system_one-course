# Super Turbotuga

A one-level 2D platform game where Turbotuga ships code to production. A human can play it, or a System One model can play it through an MCP server.

## Commands

```bash
make start         # installs the dependencies if needed and serves the game on http://localhost:3200 (Ctrl+C stops it)
make pilot         # Jev plays the game through the MCP server
npm run start      # game server only (PORT to change it)
npm run mcp        # MCP server over stdio
npm run test
npm run typecheck
```

It needs Node.js 24 or later: Node runs the TypeScript files directly. The pilot needs `AI_GATEWAY_API_KEY` in the environment or in `.env.local`.

## How to play

1. Run `make start` and open http://localhost:3200.
2. Choose **Play** to play with the keyboard: `←` `→` to move, `Space` to jump, `Shift` to run and `Esc` to go back to the menu.
3. Choose **System One** and click **▶ Play Jev** (or run `make pilot`) to let the model play. **⏸ Pause Jev** stops the pilot, and **▶ Play Jev** resumes the same game where it stopped. It also takes control of a game that you are playing.

In System One mode, the game waits for each action. Every turn, the page shows the request sent to the model (its `state` and its `questions`), the chosen action with the probability of each option, and the history of all the decisions.

## How the System One mode works

```
browser (game) ⇄ src/server.ts ⇄ src/mcp.ts (MCP server) ⇄ src/pilot.ts (MCP client) → Jev
```

- `public/game/` has the game. `world.js` (physics), `level.js` (the level) and `actions.js` (what Turbotuga sees and the four actions) do not use the DOM, so the tests run them in Node.
- `src/server.ts` serves the game and sends the MCP commands to the open page with Server-Sent Events.
- `src/mcp.ts` is the `turbotuga` MCP server (registered in `.mcp.json`) with these tools:
  - `get_game_state()`: status, lives, score, progress and what Turbotuga sees ahead.
  - `perform_action({ action, decision? })`: runs `walk_right`, `jump_right`, `long_jump_right` or `jump_up` and returns the events of the turn and the new state. `decision` carries the model, its request and its probabilities to show them on screen.
  - `restart_level()`: starts the level again in System One mode.
- `src/pilot.ts` connects to the MCP server, resumes the current game (or restarts the level if there is no game in progress), asks `typesafe-ai/jev` with `experimental_decide` (a `choice` question for the action and a `boolean` question for the danger) and performs the chosen action. Use `--model` (or `PILOT_MODEL`) to try another decision model, and `--pause` to change the pause between turns in milliseconds.

Any other MCP client, such as Claude Code, can also play with the same tools.
