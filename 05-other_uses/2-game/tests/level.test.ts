import assert from "node:assert/strict";
import { test } from "node:test";

import { ActionRun, isActionSettled, observe } from "../public/game/actions.js";
import { createLevel } from "../public/game/level.js";
import {
	createWorld,
	drainEvents,
	idleInput,
	stepWorld,
} from "../public/game/world.js";

type Observation = ReturnType<typeof observe>;

const dt = 1 / 120;

function idealAction(observation: Observation): string {
	const obstacle = observation.nearestObstacle;
	const closeDistance = obstacle?.type === "bug" ? 2 : 1;

	if (!obstacle || obstacle.distanceTiles > closeDistance) {
		return observation.rewardBlockAbove ? "jump_up" : "walk_right";
	}

	const size = obstacle.heightTiles ?? obstacle.widthTiles ?? 0;
	const needsLongJump = obstacle.type !== "bug" && size >= 3;

	return needsLongJump ? "long_jump_right" : "jump_right";
}

function play(world: ReturnType<typeof createWorld>, action: string) {
	const run = new ActionRun(world, action);

	for (let step = 0; step < 120 * 10; step++) {
		const input = run.done ? idleInput : run.next(dt);
		stepWorld(world, input, dt);

		if (isActionSettled(run, world)) {
			break;
		}
	}

	return drainEvents(world);
}

test("an ideal pilot deploys Turbotuga to production without dying", () => {
	const world = createWorld(createLevel());
	const deaths: string[] = [];
	let turns = 0;

	while (world.status === "playing" && turns < 400) {
		const observation = observe(world);
		const action = idealAction(observation);
		const events = play(world, action);
		turns += 1;

		for (const event of events) {
			if (event.type === "death") {
				deaths.push(
					`turn ${turns}: ${action} at x=${Math.round(world.player.x / 32)} (${observation.situation}) -> ${event.cause}`,
				);
			}
		}
	}

	assert.deepEqual(deaths, []);
	assert.equal(world.status, "won");
	console.log(`won in ${turns} turns with ${world.coins} coins and ${world.score} points`);
});

test("Turbotuga can see its surroundings at any moment of random games", () => {
	const actions = ["walk_right", "jump_right", "long_jump_right", "jump_up"];
	let seed = 7;
	const random = () => {
		seed = (seed * 16807) % 2147483647;

		return seed / 2147483647;
	};

	for (let game = 0; game < 20; game++) {
		const world = createWorld(createLevel());

		for (let turn = 0; turn < 150 && world.status === "playing"; turn++) {
			const run = new ActionRun(world, actions[Math.floor(random() * actions.length)]);

			for (let step = 0; step < 120 * 10 && !isActionSettled(run, world); step++) {
				stepWorld(world, run.done ? idleInput : run.next(dt), dt);
				observe(world);
			}
		}
	}
});
