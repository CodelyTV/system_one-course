import { TILE, Tile, isSolid } from "./level.js";
import {
	idleInput,
	isSettled,
	progressPercent,
	releaseJump,
	tileAt,
} from "./world.js";

export const actionIds = ["walk_right", "jump_right", "long_jump_right", "jump_up"];

const lookAheadColumns = 10;
const terrainStopDistance = 26;
const bugStopDistance = 70;
const terrainUnclearDistance = 240;
const bugUnclearDistance = 240;
const maxWalkDuration = 1.2;
const walkDuration = 0.5;
const jumpTimeout = 2.5;

function feetRow(player) {
	return Math.floor((player.y + player.height + 1) / TILE);
}

function columnHazard(world, column, row) {
	if (tileAt(world, column, row - 1) === Tile.spikes) {
		return { type: "spikes" };
	}

	if (isSolid(tileAt(world, column, row - 1)) || isSolid(tileAt(world, column, row - 2))) {
		let height = 0;
		while (row - 1 - height >= 0 && isSolid(tileAt(world, column, row - 1 - height))) {
			height += 1;
		}

		return { type: "wall", heightTiles: Math.max(height, 1) };
	}

	for (let below = row; below < world.level.rows; below++) {
		if (isSolid(tileAt(world, column, below))) {
			return null;
		}
	}

	return { type: "gap" };
}

function terrainObstacle(world) {
	const player = world.player;
	const front = player.x + player.width;
	const row = feetRow(player);
	const firstColumn = Math.floor((front - 1) / TILE);

	for (let column = firstColumn; column <= firstColumn + lookAheadColumns; column++) {
		const hazard = columnHazard(world, column, row);

		if (!hazard) {
			continue;
		}

		if (hazard.type === "wall" && column === firstColumn) {
			continue;
		}

		let width = 1;
		while (
			hazard.type !== "wall" &&
			column + width < world.level.columns &&
			columnHazard(world, column + width, row)?.type === hazard.type
		) {
			width += 1;
		}

		const distance = Math.max(0, column * TILE - front);

		return hazard.type === "wall"
			? { ...hazard, distance }
			: { ...hazard, widthTiles: width, distance };
	}

	return null;
}

function bugObstacle(world) {
	const player = world.player;
	const front = player.x + player.width;
	const bottom = player.y + player.height;

	const candidates = world.bugs
		.filter(
			(bug) =>
				bug.alive &&
				bug.x + bug.width > player.x &&
				bug.x - front < lookAheadColumns * TILE &&
				Math.abs(bug.y + bug.height - bottom) < TILE * 1.5,
		)
		.map((bug) => ({
			type: "bug",
			distance: Math.max(0, bug.x - front),
			movingTowardsTurbotuga: bug.vx < 0,
		}))
		.sort((a, b) => a.distance - b.distance);

	return candidates[0] ?? null;
}

function nearestObstacle(world) {
	const obstacles = [terrainObstacle(world), bugObstacle(world)].filter(Boolean);

	return obstacles.sort((a, b) => a.distance - b.distance)[0] ?? null;
}

function rewardBlockAbove(world) {
	const player = world.player;
	const column = Math.floor((player.x + player.width / 2) / TILE);
	const headRow = Math.floor(player.y / TILE);

	for (let row = headRow - 1; row >= headRow - 4; row--) {
		const tile = tileAt(world, column, row);

		if (tile === Tile.reward) {
			return true;
		}

		if (isSolid(tile)) {
			return false;
		}
	}

	return false;
}

function toTiles(distance) {
	return Math.round(distance / TILE);
}

function tiles(count) {
	return `${count} ${count === 1 ? "tile" : "tiles"}`;
}

function describe(obstacle, rewardAbove) {
	const reward = rewardAbove
		? " A </> reward block is directly above Turbotuga."
		: "";

	if (!obstacle) {
		return `The path ahead is clear for ${lookAheadColumns} tiles.${reward}`;
	}

	const distance = toTiles(obstacle.distance);
	const where = distance === 0 ? "right in front of Turbotuga" : `${tiles(distance)} ahead`;

	switch (obstacle.type) {
		case "bug":
			return `A bug is ${where}, ${obstacle.movingTowardsTurbotuga ? "walking towards" : "walking away from"} Turbotuga.${reward}`;
		case "gap":
			return `A gap of ${tiles(obstacle.widthTiles)} is ${where}.${reward}`;
		case "spikes":
			return `Merge-conflict spikes ${tiles(obstacle.widthTiles)} wide are ${where}.${reward}`;
		default:
			return `A wall ${tiles(obstacle.heightTiles)} high is ${where}.${reward}`;
	}
}

export function observe(world) {
	const obstacle = nearestObstacle(world);
	const rewardAbove = rewardBlockAbove(world);

	return {
		situation: describe(obstacle, rewardAbove),
		nearestObstacle: obstacle
			? {
					type: obstacle.type,
					distanceTiles: toTiles(obstacle.distance),
					...(obstacle.widthTiles ? { widthTiles: obstacle.widthTiles } : {}),
					...(obstacle.heightTiles ? { heightTiles: obstacle.heightTiles } : {}),
					...(obstacle.type === "bug"
						? { movingTowardsTurbotuga: obstacle.movingTowardsTurbotuga }
						: {}),
				}
			: null,
		rewardBlockAbove: rewardAbove,
		onGround: world.player.onGround,
		progressPercent: progressPercent(world),
	};
}

function obstacleIsClose(obstacle) {
	if (!obstacle) {
		return false;
	}

	return obstacle.distance <= (obstacle.type === "bug" ? bugStopDistance : terrainStopDistance);
}

function obstacleIsNear(obstacle) {
	if (!obstacle || obstacleIsClose(obstacle)) {
		return false;
	}

	return obstacle.distance <= (obstacle.type === "bug" ? bugUnclearDistance : terrainUnclearDistance);
}

export class ActionRun {
	constructor(world, action) {
		this.world = world;
		this.action = action;
		this.elapsed = 0;
		this.leftGround = false;
		this.done = false;
		this.startedClose = obstacleIsClose(nearestObstacle(world));
		this.startedUnderReward = rewardBlockAbove(world);
		releaseJump(world);
	}

	next(dt) {
		this.elapsed += dt;

		if (this.world.status !== "playing") {
			this.done = true;

			return idleInput;
		}

		if (this.action === "walk_right") {
			return this.walk();
		}

		return this.jump();
	}

	walk() {
		const closeNow = obstacleIsClose(nearestObstacle(this.world));
		const underRewardNow = rewardBlockAbove(this.world);

		if (
			(this.elapsed >= walkDuration && !obstacleIsNear(nearestObstacle(this.world))) ||
			this.elapsed >= maxWalkDuration ||
			(closeNow && !this.startedClose) ||
			(underRewardNow && !this.startedUnderReward)
		) {
			this.done = true;

			return idleInput;
		}

		if (!closeNow) {
			this.startedClose = false;
		}

		if (!underRewardNow) {
			this.startedUnderReward = false;
		}

		return { ...idleInput, right: true };
	}

	jump() {
		const player = this.world.player;

		if (!player.onGround) {
			this.leftGround = true;
		}

		if (
			(this.leftGround && player.onGround) ||
			this.elapsed >= jumpTimeout ||
			(!this.leftGround && this.elapsed > 0.15)
		) {
			this.done = true;

			return idleInput;
		}

		return {
			left: false,
			right: this.action !== "jump_up",
			jump: true,
			run: this.action === "long_jump_right",
		};
	}
}

export function isActionSettled(run, world) {
	return run.done && isSettled(world);
}
