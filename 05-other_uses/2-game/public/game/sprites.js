import { TILE, Tile } from "./level.js";

export const palette = {
	lime: "#9be22d",
	limeDark: "#5e9c12",
	ink: "#0b0f1d",
	night: "#121a33",
	gold: "#ffcf3f",
	goldDark: "#b07d00",
	red: "#ff5470",
	cyan: "#5ce1ff",
	pink: "#ff79c6",
	purple: "#7c5cff",
	yellow: "#f1fa8c",
	steel: "#3d4a6b",
	steelLight: "#5b6c96",
};

function canvas(width, height) {
	const element = document.createElement("canvas");
	element.width = width;
	element.height = height;

	return [element, element.getContext("2d")];
}

function roundedRect(context, x, y, width, height, radius) {
	context.beginPath();
	context.roundRect(x, y, width, height, radius);
}

const syntaxColors = [palette.pink, palette.cyan, palette.yellow, palette.lime, "#bd93f9", "#ffb86c"];

function seeded(seed) {
	let value = seed;

	return () => {
		value = (value * 16807) % 2147483647;

		return (value - 1) / 2147483646;
	};
}

function groundTile(top, seed) {
	const [element, context] = canvas(TILE, TILE);
	const random = seeded(seed);

	context.fillStyle = "#1c2440";
	context.fillRect(0, 0, TILE, TILE);
	context.fillStyle = "#222c4f";
	for (let index = 0; index < 4; index++) {
		context.fillRect(Math.floor(random() * 28), Math.floor(random() * 28), 4, 4);
	}
	context.fillStyle = "#161d36";
	context.fillRect(0, TILE - 2, TILE, 2);
	context.fillRect(TILE - 2, 0, 2, TILE);

	if (top) {
		context.fillStyle = palette.limeDark;
		context.fillRect(0, 0, TILE, 9);
		context.fillStyle = palette.lime;
		context.fillRect(0, 0, TILE, 6);
		context.fillStyle = "#c9ff6e";
		context.fillRect(0, 0, TILE, 2);
		context.fillStyle = palette.limeDark;
		for (let x = 2; x < TILE; x += 7) {
			context.fillRect(x + Math.floor(random() * 3), 9, 3, 2 + Math.floor(random() * 3));
		}
	}

	return element;
}

function brickTile(seed) {
	const [element, context] = canvas(TILE, TILE);
	const random = seeded(seed);

	context.fillStyle = "#2a2150";
	roundedRect(context, 1, 1, TILE - 2, TILE - 2, 4);
	context.fill();
	context.strokeStyle = "#4a3a8c";
	context.lineWidth = 2;
	context.stroke();

	for (let line = 0; line < 4; line++) {
		let x = 5 + (line % 2) * 4;
		const y = 6 + line * 6;
		while (x < TILE - 6) {
			const width = 3 + Math.floor(random() * 8);
			context.fillStyle = syntaxColors[Math.floor(random() * syntaxColors.length)];
			context.globalAlpha = 0.85;
			context.fillRect(x, y, Math.min(width, TILE - 6 - x), 3);
			x += width + 2;
		}
	}
	context.globalAlpha = 1;

	return element;
}

function rewardTile(used) {
	const [element, context] = canvas(TILE, TILE);

	const gradient = context.createLinearGradient(0, 0, 0, TILE);
	gradient.addColorStop(0, used ? "#5a6078" : "#ffe27a");
	gradient.addColorStop(1, used ? "#3d4258" : "#f0a800");
	context.fillStyle = gradient;
	roundedRect(context, 1, 1, TILE - 2, TILE - 2, 5);
	context.fill();
	context.strokeStyle = used ? "#2a2e40" : palette.goldDark;
	context.lineWidth = 2;
	context.stroke();

	context.fillStyle = used ? "#2a2e40" : palette.goldDark;
	for (const [x, y] of [[5, 5], [TILE - 7, 5], [5, TILE - 7], [TILE - 7, TILE - 7]]) {
		context.fillRect(x, y, 2, 2);
	}

	if (!used) {
		context.fillStyle = "#5a3a00";
		context.font = "bold 13px 'JetBrains Mono', monospace";
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillText("</>", TILE / 2, TILE / 2 + 1);
	}

	return element;
}

function serverTile() {
	const [element, context] = canvas(TILE, TILE);

	context.fillStyle = palette.steel;
	context.fillRect(0, 0, TILE, TILE);
	context.fillStyle = palette.steelLight;
	context.fillRect(0, 0, TILE, 3);
	context.fillStyle = "#28324d";
	context.fillRect(0, TILE - 3, TILE, 3);
	context.fillStyle = "#1a2136";
	context.fillRect(4, 10, 18, 4);
	context.fillRect(4, 18, 18, 4);
	context.fillStyle = palette.lime;
	context.fillRect(25, 10, 3, 3);
	context.fillStyle = palette.cyan;
	context.fillRect(25, 18, 3, 3);

	return element;
}

function spikesTile() {
	const [element, context] = canvas(TILE, TILE);

	for (let index = 0; index < 4; index++) {
		const x = index * 8;
		const gradient = context.createLinearGradient(0, 12, 0, TILE);
		gradient.addColorStop(0, "#ffd0da");
		gradient.addColorStop(0.35, palette.red);
		gradient.addColorStop(1, "#9c1a36");
		context.fillStyle = gradient;
		context.beginPath();
		context.moveTo(x, TILE);
		context.lineTo(x + 4, 12);
		context.lineTo(x + 8, TILE);
		context.closePath();
		context.fill();
	}

	return element;
}

export function createTileSprites() {
	return {
		groundTop: [0, 1, 2].map((seed) => groundTile(true, seed + 7)),
		ground: [0, 1, 2].map((seed) => groundTile(false, seed + 31)),
		brick: [0, 1, 2, 3].map((seed) => brickTile(seed + 3)),
		[Tile.reward]: rewardTile(false),
		[Tile.usedReward]: rewardTile(true),
		[Tile.server]: serverTile(),
		[Tile.spikes]: spikesTile(),
	};
}

export async function loadTurbotuga(source, height) {
	const image = new Image();
	image.src = source;
	await image.decode();

	const [probe, probeContext] = canvas(image.width, image.height);
	probeContext.drawImage(image, 0, 0);
	const { data } = probeContext.getImageData(0, 0, image.width, image.height);

	let minX = image.width;
	let minY = image.height;
	let maxX = 0;
	let maxY = 0;

	for (let y = 0; y < image.height; y++) {
		for (let x = 0; x < image.width; x++) {
			if (data[(y * image.width + x) * 4 + 3] > 24) {
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			}
		}
	}

	const crop = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };

	return {
		image,
		crop,
		width: Math.round((crop.width / crop.height) * height),
		height,
	};
}

const codeLines = [
	"const deploy = async () => {",
	"  await tests.run();",
	"  if (bugs.length > 0) throw new Error('🐞');",
	"}",
	"git commit -m \"feat: jump higher\"",
	"export class Turbotuga extends Hero {}",
	"for (const coin of level.coins) collect(coin);",
	"// TODO: refactor this later",
	"SELECT * FROM bugs WHERE fixed = false;",
	"npm run deploy -- --prod",
	"decide({ model: 'typesafe-ai/jev' })",
	"return speed * Math.PI;",
	"while (!deployed) keepCoding();",
	"docker compose up -d",
	"if (coffee === 0) sleep();",
	"type Bug = { severity: 'critical' };",
];

export function createCodeBackdrop(width, height) {
	const [element, context] = canvas(width, height);
	const random = seeded(42);

	context.font = "13px 'JetBrains Mono', monospace";
	context.textBaseline = "top";

	for (let y = 24; y < height - 60; y += 22) {
		let x = Math.floor(random() * 120) - 60;
		while (x < width) {
			const line = codeLines[Math.floor(random() * codeLines.length)];
			context.fillStyle = syntaxColors[Math.floor(random() * syntaxColors.length)];
			context.globalAlpha = 0.05 + random() * 0.05;
			context.fillText(line, x, y);
			x += context.measureText(line).width + 60 + random() * 160;
		}
	}
	context.globalAlpha = 1;

	return element;
}

export function createSkyline(width, height) {
	const [element, context] = canvas(width, height);
	const random = seeded(7);
	const lights = [];
	let x = 0;

	while (x < width) {
		const towerWidth = 50 + Math.floor(random() * 70);
		const towerHeight = 90 + Math.floor(random() * 170);
		const top = height - towerHeight;
		context.fillStyle = "#18213f";
		context.fillRect(x, top, towerWidth, towerHeight);
		context.fillStyle = "#1e2a50";
		context.fillRect(x, top, towerWidth, 3);

		for (let unit = top + 12; unit < height - 10; unit += 14) {
			context.fillStyle = "#141c36";
			context.fillRect(x + 6, unit, towerWidth - 12, 8);

			if (random() < 0.35) {
				lights.push({
					x: x + towerWidth - 12,
					y: unit + 2,
					color: random() < 0.6 ? palette.lime : palette.cyan,
					phase: random() * Math.PI * 2,
					speed: 1 + random() * 3,
				});
			}
		}

		x += towerWidth + 14 + Math.floor(random() * 40);
	}

	return { image: element, lights };
}

export { roundedRect };
