export const TILE = 32;
export const ROWS = 17;
export const GROUND_ROW = 15;

export const Tile = {
	empty: 0,
	ground: 1,
	brick: 2,
	reward: 3,
	usedReward: 4,
	pipe: 5,
	server: 6,
	spikes: 7,
};

const solidTiles = new Set([
	Tile.ground,
	Tile.brick,
	Tile.reward,
	Tile.usedReward,
	Tile.pipe,
	Tile.server,
]);

export function isSolid(tile) {
	return solidTiles.has(tile);
}

class LevelBuilder {
	constructor(columns) {
		this.columns = columns;
		this.tiles = new Uint8Array(columns * ROWS);
		this.coins = [];
		this.bugs = [];
		this.signs = [];
		this.checkpoint = null;
		this.flag = null;
		this.groundFrom(0, columns);
	}

	set(column, row, tile) {
		if (column >= 0 && column < this.columns && row >= 0 && row < ROWS) {
			this.tiles[row * this.columns + column] = tile;
		}
	}

	groundFrom(from, to) {
		for (let column = from; column < to; column++) {
			for (let row = GROUND_ROW; row < ROWS; row++) {
				this.set(column, row, Tile.ground);
			}
		}

		return this;
	}

	gap(column, width) {
		for (let x = column; x < column + width; x++) {
			for (let row = GROUND_ROW; row < ROWS; row++) {
				this.set(x, row, Tile.empty);
			}
		}

		return this;
	}

	pipe(column, height) {
		for (let row = GROUND_ROW - height; row < GROUND_ROW; row++) {
			this.set(column, row, Tile.pipe);
			this.set(column + 1, row, Tile.pipe);
		}

		return this;
	}

	spikes(column, width) {
		for (let x = column; x < column + width; x++) {
			this.set(x, GROUND_ROW - 1, Tile.spikes);
		}

		return this;
	}

	bricks(column, row, pattern) {
		[...pattern].forEach((symbol, index) => {
			const tile = symbol === "?" ? Tile.reward : Tile.brick;
			this.set(column + index, row, tile);
		});

		return this;
	}

	reward(column, row = GROUND_ROW - 4) {
		this.set(column, row, Tile.reward);

		return this;
	}

	stairs(column, heights) {
		heights.forEach((height, index) => {
			for (let row = GROUND_ROW - height; row < GROUND_ROW; row++) {
				this.set(column + index, row, Tile.server);
			}
		});

		return this;
	}

	coinRow(column, row, count) {
		for (let index = 0; index < count; index++) {
			this.coins.push({ column: column + index, row });
		}

		return this;
	}

	bug(column) {
		this.bugs.push({ column });

		return this;
	}

	sign(column, text) {
		this.signs.push({ column, text });

		return this;
	}

	commit(column) {
		this.checkpoint = { column };

		return this;
	}

	deploy(column) {
		this.flag = { column };

		return this;
	}

	build() {
		return {
			columns: this.columns,
			rows: ROWS,
			tiles: this.tiles,
			coins: this.coins,
			bugs: this.bugs,
			signs: this.signs,
			checkpoint: this.checkpoint,
			flag: this.flag,
			spawn: { column: 3 },
		};
	}
}

export function createLevel() {
	const coinRow = GROUND_ROW - 1;

	return new LevelBuilder(196)
		.sign(2, "main()")
		.coinRow(7, coinRow, 3)
		.reward(13)
		.bricks(16, GROUND_ROW - 4, "B?B")
		.coinRow(16, GROUND_ROW - 6, 3)
		.sign(20, "// TODO: fix bugs")
		.bug(26)
		.pipe(33, 2)
		.coinRow(37, coinRow, 3)
		.sign(41, "404")
		.gap(44, 2)
		.bug(53)
		.bug(56)
		.pipe(62, 3)
		.coinRow(66, coinRow, 2)
		.reward(70)
		.bricks(74, GROUND_ROW - 4, "BBB")
		.coinRow(74, GROUND_ROW - 6, 3)
		.sign(77, "git merge")
		.spikes(80, 2)
		.commit(87)
		.coinRow(91, coinRow, 3)
		.gap(96, 3)
		.bug(106)
		.pipe(112, 2)
		.pipe(118, 3)
		.sign(122, "Stack Overflow")
		.gap(125, 4)
		.coinRow(132, coinRow, 3)
		.spikes(137, 3)
		.reward(146)
		.bug(151)
		.bricks(155, GROUND_ROW - 4, "BB?BB")
		.coinRow(155, GROUND_ROW - 6, 5)
		.gap(163, 2)
		.stairs(169, [1, 2, 3, 4])
		.sign(166, "npm run deploy")
		.deploy(178)
		.build();
}
