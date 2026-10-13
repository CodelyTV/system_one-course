import { GROUND_ROW, TILE, Tile, isSolid } from "./level.js";

export const Physics = {
	gravity: 2000,
	maxFallSpeed: 950,
	walkSpeed: 205,
	runSpeed: 290,
	groundAcceleration: 2600,
	airAcceleration: 2400,
	groundFriction: 2400,
	jumpSpeed: 690,
	longJumpSpeed: 730,
	jumpCutSpeed: 280,
	stompBounceSpeed: 440,
	coyoteTime: 0.08,
	jumpBufferTime: 0.12,
	bugSpeed: 55,
};

const playerSize = { width: 26, height: 42 };
const bugSize = { width: 28, height: 22 };
const coinRadius = 11;
const dyingDuration = 1.8;
const winningDuration = 3.2;
const startingLives = 3;

export const idleInput = Object.freeze({
	left: false,
	right: false,
	jump: false,
	run: false,
});

export function createWorld(level) {
	const world = {
		level,
		tiles: Uint8Array.from(level.tiles),
		lives: startingLives,
		score: 0,
		coins: 0,
		status: "playing",
		statusTime: 0,
		time: 0,
		checkpointReached: false,
		respawnColumn: level.spawn.column,
		events: [],
		previousJump: false,
		coinItems: level.coins.map(({ column, row }) => ({
			x: column * TILE + TILE / 2,
			y: row * TILE + TILE / 2,
			taken: false,
		})),
		bugs: [],
		player: createPlayer(level.spawn.column),
	};

	spawnBugs(world);

	return world;
}

function createPlayer(column) {
	return {
		x: column * TILE + (TILE - playerSize.width) / 2,
		y: GROUND_ROW * TILE - playerSize.height,
		width: playerSize.width,
		height: playerSize.height,
		vx: 0,
		vy: 0,
		onGround: true,
		facing: 1,
		coyote: 0,
		jumpBuffer: 0,
		airTime: 0,
		landedAt: -1,
	};
}

function spawnBugs(world) {
	world.bugs = world.level.bugs.map(({ column }) => ({
		x: column * TILE + (TILE - bugSize.width) / 2,
		y: GROUND_ROW * TILE - bugSize.height,
		width: bugSize.width,
		height: bugSize.height,
		vx: -Physics.bugSpeed,
		vy: 0,
		alive: true,
		squashedAt: -1,
	}));
}

export function tileAt(world, column, row) {
	if (row < 0 || row >= world.level.rows) {
		return Tile.empty;
	}

	if (column < 0 || column >= world.level.columns) {
		return Tile.ground;
	}

	return world.tiles[row * world.level.columns + column];
}

function setTile(world, column, row, tile) {
	world.tiles[row * world.level.columns + column] = tile;
}

function solidAt(world, column, row) {
	return isSolid(tileAt(world, column, row));
}

function emit(world, type, data = {}) {
	world.events.push({ type, time: world.time, ...data });
}

export function drainEvents(world) {
	const events = world.events;
	world.events = [];

	return events;
}

export function releaseJump(world) {
	world.previousJump = false;
}

export function levelWidth(world) {
	return world.level.columns * TILE;
}

export function flagX(world) {
	return world.level.flag.column * TILE + TILE / 2;
}

export function progressPercent(world) {
	const start = world.level.spawn.column * TILE;
	const traveled = world.player.x - start;

	return Math.max(
		0,
		Math.min(100, Math.round((traveled / (flagX(world) - start)) * 100)),
	);
}

export function stepWorld(world, input, dt) {
	world.time += dt;
	world.statusTime += dt;

	if (world.status === "playing") {
		updatePlayer(world, input, dt);
		updateBugs(world, dt);
		collectCoins(world);
		checkHazards(world);
		checkCheckpoint(world);
		checkFlag(world);
	} else if (world.status === "dying") {
		updateDying(world, dt);
	} else if (world.status === "winning") {
		updateWinning(world, dt);
	}

	world.previousJump = input.jump;
}

function approach(value, target, delta) {
	if (value < target) {
		return Math.min(value + delta, target);
	}

	return Math.max(value - delta, target);
}

function updatePlayer(world, input, dt) {
	const player = world.player;
	const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
	const maxSpeed = input.run ? Physics.runSpeed : Physics.walkSpeed;

	if (direction !== 0) {
		const acceleration = player.onGround
			? Physics.groundAcceleration
			: Physics.airAcceleration;
		const turning = Math.sign(player.vx) === -direction;
		player.vx = approach(
			player.vx,
			direction * maxSpeed,
			acceleration * (turning ? 1.6 : 1) * dt,
		);
		player.facing = direction;
	} else if (player.onGround) {
		player.vx = approach(player.vx, 0, Physics.groundFriction * dt);
	} else {
		player.vx = approach(player.vx, 0, 250 * dt);
	}

	player.coyote = player.onGround ? Physics.coyoteTime : player.coyote - dt;
	player.jumpBuffer =
		input.jump && !world.previousJump
			? Physics.jumpBufferTime
			: player.jumpBuffer - dt;

	if (player.jumpBuffer > 0 && player.coyote > 0) {
		player.vy = -(input.run ? Physics.longJumpSpeed : Physics.jumpSpeed);
		player.onGround = false;
		player.coyote = 0;
		player.jumpBuffer = 0;
		emit(world, "jump", { long: input.run });
	}

	if (!input.jump && player.vy < -Physics.jumpCutSpeed) {
		player.vy = -Physics.jumpCutSpeed;
	}

	player.vy = Math.min(player.vy + Physics.gravity * dt, Physics.maxFallSpeed);

	moveHorizontally(world, player, player.vx * dt);
	const wasOnGround = player.onGround;
	moveVertically(world, player, player.vy * dt);

	if (player.onGround) {
		if (!wasOnGround) {
			player.landedAt = world.time;
			emit(world, "land", { airTime: player.airTime });
		}
		player.airTime = 0;
	} else {
		player.airTime += dt;
	}

	player.x = Math.max(0, Math.min(player.x, levelWidth(world) - player.width));

	if (player.y > world.level.rows * TILE + 40) {
		die(world, "gap");
	}
}

function moveHorizontally(world, body, dx) {
	body.x += dx;

	const top = Math.floor(body.y / TILE);
	const bottom = Math.floor((body.y + body.height - 0.01) / TILE);

	if (dx > 0) {
		const column = Math.floor((body.x + body.width) / TILE);
		for (let row = top; row <= bottom; row++) {
			if (solidAt(world, column, row)) {
				body.x = column * TILE - body.width;
				body.vx = 0;

				return true;
			}
		}
	} else if (dx < 0) {
		const column = Math.floor(body.x / TILE);
		for (let row = top; row <= bottom; row++) {
			if (solidAt(world, column, row)) {
				body.x = (column + 1) * TILE;
				body.vx = 0;

				return true;
			}
		}
	}

	return false;
}

function moveVertically(world, body, dy) {
	body.y += dy;
	body.onGround = false;

	const left = Math.floor(body.x / TILE);
	const right = Math.floor((body.x + body.width - 0.01) / TILE);

	if (dy > 0) {
		const row = Math.floor((body.y + body.height) / TILE);
		for (let column = left; column <= right; column++) {
			if (solidAt(world, column, row)) {
				body.y = row * TILE - body.height;
				body.vy = 0;
				body.onGround = true;

				return;
			}
		}
	} else if (dy < 0) {
		const row = Math.floor(body.y / TILE);
		const hitColumns = [];
		for (let column = left; column <= right; column++) {
			if (solidAt(world, column, row)) {
				hitColumns.push(column);
			}
		}

		if (hitColumns.length > 0) {
			body.y = (row + 1) * TILE;
			body.vy = 0;

			if (body === world.player) {
				const center = body.x + body.width / 2;
				const column = hitColumns.reduce((closest, candidate) =>
					Math.abs((candidate + 0.5) * TILE - center) <
					Math.abs((closest + 0.5) * TILE - center)
						? candidate
						: closest,
				);
				hitBlock(world, column, row);
			}
		}
	}
}

function hitBlock(world, column, row) {
	const tile = tileAt(world, column, row);

	if (tile === Tile.reward) {
		setTile(world, column, row, Tile.usedReward);
		world.coins += 1;
		world.score += 200;
		emit(world, "reward", { column, row });
	} else {
		emit(world, "bump", { column, row });
	}
}

function updateBugs(world, dt) {
	for (const bug of world.bugs) {
		if (!bug.alive) {
			continue;
		}

		bug.vy = Math.min(bug.vy + Physics.gravity * dt, Physics.maxFallSpeed);
		const blocked = moveHorizontally(world, bug, bug.vx * dt);
		moveVertically(world, bug, bug.vy * dt);

		const direction = Math.sign(bug.vx) || -1;
		const frontX = direction > 0 ? bug.x + bug.width + 1 : bug.x - 1;
		const footRow = Math.floor((bug.y + bug.height + 1) / TILE);
		const ledgeAhead =
			bug.onGround && !solidAt(world, Math.floor(frontX / TILE), footRow);

		if (blocked || ledgeAhead) {
			bug.vx = -direction * Physics.bugSpeed;
		}

		if (bug.y > world.level.rows * TILE + 40) {
			bug.alive = false;
		}
	}

	const player = world.player;
	for (const bug of world.bugs) {
		if (!bug.alive || !overlaps(player, bug)) {
			continue;
		}

		const previousBottom = player.y + player.height - player.vy / 120 - 2;
		const falling = player.vy > 0;

		if (falling && previousBottom <= bug.y + 6) {
			bug.alive = false;
			bug.squashedAt = world.time;
			player.vy = -Physics.stompBounceSpeed;
			player.y = bug.y - player.height;
			world.score += 100;
			emit(world, "stomp", { x: bug.x + bug.width / 2, y: bug.y });
		} else {
			die(world, "bug");

			return;
		}
	}
}

function overlaps(a, b) {
	return (
		a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y
	);
}

function collectCoins(world) {
	const player = world.player;

	for (const coin of world.coinItems) {
		if (coin.taken) {
			continue;
		}

		const closestX = Math.max(player.x, Math.min(coin.x, player.x + player.width));
		const closestY = Math.max(player.y, Math.min(coin.y, player.y + player.height));

		if ((closestX - coin.x) ** 2 + (closestY - coin.y) ** 2 < coinRadius ** 2) {
			coin.taken = true;
			world.coins += 1;
			world.score += 50;
			emit(world, "coin", { x: coin.x, y: coin.y });
		}
	}
}

function checkHazards(world) {
	if (world.status !== "playing") {
		return;
	}

	const player = world.player;
	const left = Math.floor((player.x + 3) / TILE);
	const right = Math.floor((player.x + player.width - 3) / TILE);
	const top = Math.floor(player.y / TILE);
	const bottom = Math.floor((player.y + player.height - 1) / TILE);

	for (let column = left; column <= right; column++) {
		for (let row = top; row <= bottom; row++) {
			const spikeTop = row * TILE + TILE * 0.45;
			if (
				tileAt(world, column, row) === Tile.spikes &&
				player.y + player.height > spikeTop
			) {
				die(world, "spikes");

				return;
			}
		}
	}
}

function checkCheckpoint(world) {
	const checkpoint = world.level.checkpoint;

	if (
		!world.checkpointReached &&
		checkpoint &&
		world.player.x > checkpoint.column * TILE
	) {
		world.checkpointReached = true;
		world.respawnColumn = checkpoint.column;
		emit(world, "checkpoint", { column: checkpoint.column });
	}
}

function checkFlag(world) {
	const player = world.player;

	if (player.x + player.width >= flagX(world) - 2) {
		const poleTop = (GROUND_ROW - 9) * TILE;
		const height = GROUND_ROW * TILE - poleTop;
		const bonus =
			Math.round(
				Math.max(0, Math.min(1, (GROUND_ROW * TILE - player.y - player.height) / height)) * 40,
			) *
				100 +
			1000;

		world.score += bonus;
		world.status = "winning";
		world.statusTime = 0;
		player.x = flagX(world) - player.width + 4;
		player.vx = 0;
		player.vy = 0;
		player.facing = 1;
		emit(world, "flag", { bonus });
	}
}

function die(world, cause) {
	if (world.status !== "playing") {
		return;
	}

	world.status = "dying";
	world.statusTime = 0;
	world.player.vx = 0;
	world.player.vy = cause === "gap" ? 0 : -620;
	emit(world, "death", { cause });
}

function updateDying(world, dt) {
	const player = world.player;

	if (world.statusTime > 0.35) {
		player.vy = Math.min(player.vy + Physics.gravity * dt, Physics.maxFallSpeed);
		player.y += player.vy * dt;
	}

	if (world.statusTime >= dyingDuration) {
		world.lives -= 1;

		if (world.lives <= 0) {
			world.status = "gameOver";
			world.statusTime = 0;
			emit(world, "gameOver");

			return;
		}

		world.player = createPlayer(world.respawnColumn);
		spawnBugs(world);
		world.status = "playing";
		world.statusTime = 0;
		emit(world, "respawn", { lives: world.lives });
	}
}

function updateWinning(world, dt) {
	const player = world.player;
	const groundY = GROUND_ROW * TILE - player.height;

	if (player.y < groundY) {
		player.y = Math.min(groundY, player.y + 260 * dt);
		player.onGround = player.y >= groundY;

		return;
	}

	player.onGround = true;

	if (world.statusTime > 1) {
		player.vx = Physics.walkSpeed * 0.7;
		player.x += player.vx * dt;
	}

	if (world.statusTime >= winningDuration) {
		world.status = "won";
		world.statusTime = 0;
		player.vx = 0;
		emit(world, "won", { score: world.score });
	}
}

export function isSettled(world) {
	return world.status === "playing" || world.status === "gameOver" || world.status === "won";
}

export function isFinished(world) {
	return world.status === "gameOver" || world.status === "won";
}
