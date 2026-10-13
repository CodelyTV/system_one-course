import { GROUND_ROW, TILE, Tile } from "./level.js";
import {
	createCodeBackdrop,
	createSkyline,
	createTileSprites,
	palette,
	roundedRect,
} from "./sprites.js";
import { flagX, levelWidth, progressPercent, tileAt } from "./world.js";

export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;

const hudFont = "'Press Start 2P', monospace";
const codeFont = "'JetBrains Mono', monospace";
const poleRows = 9;
const buildingColumn = 183;
const buildingColumns = 9;
const doorX = (buildingColumn + 4.5) * TILE;

const clouds = [
	{ x: 120, y: 70, scale: 1, label: "AWS" },
	{ x: 520, y: 120, scale: 0.8, label: "k8s" },
	{ x: 860, y: 60, scale: 1.2, label: "CDN" },
	{ x: 1300, y: 100, scale: 0.9, label: "S3" },
	{ x: 1700, y: 55, scale: 1.1, label: "edge" },
];

export class Effects {
	constructor() {
		this.particles = [];
		this.popups = [];
		this.shake = 0;
	}

	burst(x, y, colors, count, { speed = 180, gravity = 600, size = 4, life = 0.7 } = {}) {
		for (let index = 0; index < count; index++) {
			const angle = Math.random() * Math.PI * 2;
			const velocity = speed * (0.4 + Math.random() * 0.6);
			this.particles.push({
				x,
				y,
				vx: Math.cos(angle) * velocity,
				vy: Math.sin(angle) * velocity - speed * 0.4,
				gravity,
				size: size * (0.6 + Math.random() * 0.8),
				color: colors[index % colors.length],
				life,
				maxLife: life,
			});
		}
	}

	dust(x, y) {
		for (let index = 0; index < 6; index++) {
			this.particles.push({
				x: x + (Math.random() - 0.5) * 20,
				y,
				vx: (Math.random() - 0.5) * 120,
				vy: -Math.random() * 60,
				gravity: 120,
				size: 3 + Math.random() * 3,
				color: "rgba(200, 220, 255, 0.5)",
				life: 0.4,
				maxLife: 0.4,
			});
		}
	}

	popup(x, y, text, color = "#ffffff") {
		this.popups.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
	}

	update(dt) {
		for (const particle of this.particles) {
			particle.vy += particle.gravity * dt;
			particle.x += particle.vx * dt;
			particle.y += particle.vy * dt;
			particle.life -= dt;
		}
		for (const popup of this.popups) {
			popup.y -= 40 * dt;
			popup.life -= dt;
		}
		this.particles = this.particles.filter(({ life }) => life > 0);
		this.popups = this.popups.filter(({ life }) => life > 0);
		this.shake = Math.max(0, this.shake - dt * 3);
	}
}

export class Renderer {
	constructor(canvas, turbotuga) {
		this.canvas = canvas;
		this.context = canvas.getContext("2d");
		this.turbotuga = turbotuga;
		this.tiles = createTileSprites();
		this.codeBackdrop = createCodeBackdrop(1600, VIEW_HEIGHT);
		this.skyline = createSkyline(1400, 300);
		this.cameraX = 0;
		this.resize();
	}

	resize(displayScale = 1) {
		const ratio = Math.min(3, Math.max(1, (window.devicePixelRatio || 1) * displayScale));
		this.canvas.width = VIEW_WIDTH * ratio;
		this.canvas.height = VIEW_HEIGHT * ratio;
		this.ratio = ratio;
	}

	follow(world, dt, snap = false) {
		const target = Math.max(
			0,
			Math.min(world.player.x - VIEW_WIDTH * 0.38, levelWidth(world) - VIEW_WIDTH),
		);
		this.cameraX = snap ? target : this.cameraX + (target - this.cameraX) * Math.min(1, dt * 6);
	}

	draw(world, scene) {
		const context = this.context;
		context.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
		context.imageSmoothingEnabled = true;

		const shakeX = scene.effects.shake > 0 ? (Math.random() - 0.5) * 10 * scene.effects.shake : 0;
		const shakeY = scene.effects.shake > 0 ? (Math.random() - 0.5) * 10 * scene.effects.shake : 0;
		const cameraX = Math.round(this.cameraX + shakeX);

		this.drawSky(scene.time, cameraX);

		context.save();
		context.translate(-cameraX, Math.round(shakeY));
		this.drawGapGlow(world, cameraX);
		this.drawSigns(world, cameraX);
		this.drawBuilding(world, scene.time);
		this.drawCheckpoint(world, scene.time);
		this.drawFlag(world, scene.time);
		this.drawTiles(world, cameraX, scene);
		this.drawPipes(world, cameraX);
		this.drawCoins(world, scene.time, cameraX);
		this.drawBugs(world, scene.time, cameraX);
		this.drawPlayer(world, scene.time);
		this.drawParticles(scene.effects);
		this.drawBubble(world, scene);
		context.restore();

		this.drawHud(world, scene);
	}

	drawSky(time, cameraX) {
		const context = this.context;
		const gradient = context.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
		gradient.addColorStop(0, "#070a17");
		gradient.addColorStop(0.6, "#121a38");
		gradient.addColorStop(1, "#1d1b45");
		context.fillStyle = gradient;
		context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

		context.font = `10px ${codeFont}`;
		for (let index = 0; index < 40; index++) {
			const x = (((index * 173) % 997) - cameraX * 0.05 + 2000) % VIEW_WIDTH;
			const y = (index * 97) % 260;
			context.globalAlpha = 0.15 + 0.25 * Math.abs(Math.sin(time * 0.8 + index));
			context.fillStyle = index % 3 === 0 ? palette.lime : "#9fb4ff";
			context.fillText(index % 2 ? "1" : "0", x, y + 20);
		}
		context.globalAlpha = 1;

		this.drawTiled(this.codeBackdrop, cameraX * 0.12, 0);
		this.drawClouds(time, cameraX);

		const skylineY = VIEW_HEIGHT - this.skyline.image.height - 40;
		const offset = (cameraX * 0.3) % this.skyline.image.width;
		this.drawTiled(this.skyline.image, cameraX * 0.3, skylineY);

		for (const light of this.skyline.lights) {
			const brightness = 0.35 + 0.65 * Math.max(0, Math.sin(time * light.speed + light.phase));
			context.globalAlpha = brightness;
			context.fillStyle = light.color;
			for (const tileOffset of [0, this.skyline.image.width]) {
				const x = light.x - offset + tileOffset;
				if (x > -4 && x < VIEW_WIDTH) {
					context.fillRect(x, skylineY + light.y, 3, 3);
				}
			}
		}
		context.globalAlpha = 1;
	}

	drawTiled(image, offsetX, y) {
		const width = image.width;
		let x = -(offsetX % width);
		while (x < VIEW_WIDTH) {
			this.context.drawImage(image, x, y);
			x += width;
		}
	}

	drawClouds(time, cameraX) {
		const context = this.context;
		const span = 2000;

		for (const cloud of clouds) {
			const x = ((((cloud.x - cameraX * 0.45 + time * 8) % span) + span) % span) - 150;
			const y = cloud.y + Math.sin(time * 0.5 + cloud.x) * 3;
			const scale = cloud.scale;

			context.fillStyle = "rgba(120, 140, 220, 0.12)";
			context.beginPath();
			context.arc(x, y, 22 * scale, 0, Math.PI * 2);
			context.arc(x + 26 * scale, y - 10 * scale, 26 * scale, 0, Math.PI * 2);
			context.arc(x + 54 * scale, y, 20 * scale, 0, Math.PI * 2);
			context.fill();
			context.fillRect(x, y, 54 * scale, 20 * scale);

			context.fillStyle = "rgba(180, 200, 255, 0.35)";
			context.font = `${Math.round(9 * scale)}px ${hudFont}`;
			context.textAlign = "center";
			context.fillText(cloud.label, x + 27 * scale, y + 8 * scale);
		}
		context.textAlign = "left";
	}

	visibleColumns(cameraX) {
		const first = Math.max(0, Math.floor(cameraX / TILE) - 1);

		return [first, first + Math.ceil(VIEW_WIDTH / TILE) + 2];
	}

	drawGapGlow(world, cameraX) {
		const context = this.context;
		const [first, last] = this.visibleColumns(cameraX);

		for (let column = first; column <= last; column++) {
			if (tileAt(world, column, GROUND_ROW) !== Tile.empty) {
				continue;
			}

			const gradient = context.createLinearGradient(0, GROUND_ROW * TILE, 0, VIEW_HEIGHT);
			gradient.addColorStop(0, "rgba(255, 84, 112, 0)");
			gradient.addColorStop(1, "rgba(255, 84, 112, 0.25)");
			context.fillStyle = gradient;
			context.fillRect(column * TILE, GROUND_ROW * TILE, TILE, VIEW_HEIGHT - GROUND_ROW * TILE);

			if (tileAt(world, column - 1, GROUND_ROW) !== Tile.empty) {
				context.fillStyle = "rgba(255, 84, 112, 0.55)";
				context.font = `8px ${hudFont}`;
				context.fillText("404", column * TILE + 4, VIEW_HEIGHT - 10);
			}
		}
	}

	drawTiles(world, cameraX, scene) {
		const context = this.context;
		const [first, last] = this.visibleColumns(cameraX);

		for (let column = first; column <= last; column++) {
			for (let row = 0; row < world.level.rows; row++) {
				const tile = tileAt(world, column, row);
				const x = column * TILE;
				let y = row * TILE;

				if (tile === Tile.empty || tile === Tile.pipe) {
					continue;
				}

				const bump = scene.bumps.get(`${column}:${row}`);
				if (bump !== undefined) {
					y -= Math.sin(Math.min(1, (scene.time - bump) / 0.2) * Math.PI) * 8;
				}

				if (tile === Tile.ground) {
					const variant = (column * 7 + row * 3) % 3;
					const isTop = tileAt(world, column, row - 1) !== Tile.ground;
					context.drawImage(isTop ? this.tiles.groundTop[variant] : this.tiles.ground[variant], x, y);
				} else if (tile === Tile.brick) {
					context.drawImage(this.tiles.brick[(column * 5 + row) % 4], x, y);
				} else if (tile === Tile.reward) {
					const glow = 0.5 + 0.5 * Math.sin(scene.time * 4 + column);
					context.shadowColor = `rgba(255, 207, 63, ${0.4 + glow * 0.4})`;
					context.shadowBlur = 10 + glow * 8;
					context.drawImage(this.tiles[tile], x, y);
					context.shadowBlur = 0;
				} else {
					context.drawImage(this.tiles[tile], x, y);
				}
			}
		}
	}

	drawPipes(world, cameraX) {
		const context = this.context;
		const [first, last] = this.visibleColumns(cameraX);

		for (let column = first - 1; column <= last; column++) {
			let top = -1;
			for (let row = 0; row < GROUND_ROW; row++) {
				if (tileAt(world, column, row) === Tile.pipe && tileAt(world, column - 1, row) !== Tile.pipe) {
					top = row;
					break;
				}
			}

			if (top < 0) {
				continue;
			}

			const x = column * TILE;
			const y = top * TILE;
			const height = GROUND_ROW * TILE - y;

			const body = context.createLinearGradient(x, 0, x + TILE * 2, 0);
			body.addColorStop(0, "#0f6b3a");
			body.addColorStop(0.3, "#2fd87a");
			body.addColorStop(0.5, "#7dffb4");
			body.addColorStop(0.7, "#22b765");
			body.addColorStop(1, "#0b4f2b");
			context.fillStyle = body;
			context.fillRect(x + 4, y + 14, TILE * 2 - 8, height - 14);
			context.strokeStyle = "#063d20";
			context.lineWidth = 2;
			context.strokeRect(x + 4, y + 14, TILE * 2 - 8, height - 14);

			context.fillStyle = body;
			roundedRect(context, x - 2, y, TILE * 2 + 4, 18, 3);
			context.fill();
			context.stroke();

			context.fillStyle = "#04301a";
			context.font = `bold 11px ${codeFont}`;
			context.textAlign = "center";
			context.fillText(">_", x + TILE, y + 13);
			context.textAlign = "left";
		}
	}

	drawSigns(world) {
		const context = this.context;
		context.font = `bold 12px ${codeFont}`;

		for (const sign of world.level.signs) {
			const text = sign.text;
			const width = context.measureText(text).width + 20;
			const x = sign.column * TILE + TILE / 2;
			const groundY = GROUND_ROW * TILE;

			context.fillStyle = "#3a4466";
			context.fillRect(x - 2, groundY - 40, 4, 40);

			context.fillStyle = "rgba(10, 14, 30, 0.92)";
			roundedRect(context, x - width / 2, groundY - 72, width, 32, 6);
			context.fill();
			context.strokeStyle = palette.lime;
			context.lineWidth = 2;
			context.stroke();

			context.fillStyle = palette.lime;
			context.textAlign = "center";
			context.fillText(text, x, groundY - 51);
			context.textAlign = "left";
		}
	}

	drawCheckpoint(world, time) {
		const checkpoint = world.level.checkpoint;
		if (!checkpoint) {
			return;
		}

		const context = this.context;
		const x = checkpoint.column * TILE + TILE / 2;
		const groundY = GROUND_ROW * TILE;
		const active = world.checkpointReached;

		context.fillStyle = "#c8d3f5";
		context.fillRect(x - 2, groundY - 110, 4, 110);

		const wave = Math.sin(time * 5) * 3;
		context.fillStyle = active ? palette.lime : "#55607f";
		context.beginPath();
		context.moveTo(x + 2, groundY - 108);
		context.quadraticCurveTo(x + 40, groundY - 108 + wave, x + 78, groundY - 100);
		context.lineTo(x + 78, groundY - 78);
		context.quadraticCurveTo(x + 40, groundY - 82 - wave, x + 2, groundY - 80);
		context.closePath();
		context.fill();

		context.fillStyle = active ? palette.ink : "#c8d3f5";
		context.font = `8px ${hudFont}`;
		context.fillText(active ? "✓ a1b2c3" : "commit", x + 10, groundY - 89);
	}

	drawFlag(world, time) {
		const context = this.context;
		const x = flagX(world);
		const groundY = GROUND_ROW * TILE;
		const top = groundY - poleRows * TILE;

		context.drawImage(this.tiles[Tile.server], x - TILE / 2, groundY - TILE);

		const pole = context.createLinearGradient(x - 3, 0, x + 3, 0);
		pole.addColorStop(0, "#9aa6c8");
		pole.addColorStop(0.5, "#ffffff");
		pole.addColorStop(1, "#9aa6c8");
		context.fillStyle = pole;
		context.fillRect(x - 3, top, 6, groundY - TILE - top);

		context.fillStyle = palette.lime;
		context.beginPath();
		context.arc(x, top - 4, 8, 0, Math.PI * 2);
		context.fill();

		let flagY = top + 8;
		if (world.status === "winning" || world.status === "won") {
			const progress = world.status === "won" ? 1 : Math.min(1, world.statusTime / 1.1);
			flagY += progress * (groundY - TILE * 2 - flagY - 30);
		}

		const wave = Math.sin(time * 6) * 4;
		context.fillStyle = palette.red;
		context.beginPath();
		context.moveTo(x - 3, flagY);
		context.quadraticCurveTo(x - 40, flagY + 4 + wave, x - 74, flagY + 2);
		context.lineTo(x - 74, flagY + 40);
		context.quadraticCurveTo(x - 40, flagY + 42 - wave, x - 3, flagY + 38);
		context.closePath();
		context.fill();

		context.fillStyle = "#ffffff";
		context.font = `9px ${hudFont}`;
		context.textAlign = "center";
		context.fillText("PROD", x - 38, flagY + 24);
		context.textAlign = "left";
	}

	drawBuilding(world, time) {
		const context = this.context;
		const x = buildingColumn * TILE;
		const width = buildingColumns * TILE;
		const groundY = GROUND_ROW * TILE;
		const height = TILE * 7;
		const top = groundY - height;

		const body = context.createLinearGradient(x, 0, x + width, 0);
		body.addColorStop(0, "#232c4a");
		body.addColorStop(0.5, "#2f3b63");
		body.addColorStop(1, "#1b2240");
		context.fillStyle = body;
		roundedRect(context, x, top, width, height, 8);
		context.fill();
		context.strokeStyle = "#475785";
		context.lineWidth = 3;
		context.stroke();

		for (let unit = 0; unit < 9; unit++) {
			const y = top + 18 + unit * 17;
			if (y > groundY - 90) {
				break;
			}
			context.fillStyle = "#161d36";
			context.fillRect(x + 14, y, width - 28, 11);
			for (let led = 0; led < 6; led++) {
				const on = Math.sin(time * (2 + led) + unit * 1.7 + led) > 0;
				context.fillStyle = on ? (led % 2 ? palette.lime : palette.cyan) : "#2a3352";
				context.fillRect(x + width - 26 - led * 7, y + 4, 4, 4);
			}
		}

		const doorWidth = 46;
		context.fillStyle = "#05070f";
		roundedRect(context, doorX - doorWidth / 2, groundY - 76, doorWidth, 76, [10, 10, 0, 0]);
		context.fill();
		context.strokeStyle = palette.lime;
		context.lineWidth = 2;
		context.stroke();

		context.fillStyle = palette.ink;
		roundedRect(context, x + width / 2 - 70, top - 34, 140, 30, 6);
		context.fill();
		context.strokeStyle = palette.lime;
		context.stroke();
		context.shadowColor = palette.lime;
		context.shadowBlur = 12;
		context.fillStyle = palette.lime;
		context.font = `12px ${hudFont}`;
		context.textAlign = "center";
		context.fillText("PRODUCTION", x + width / 2, top - 14);
		context.shadowBlur = 0;
		context.textAlign = "left";
	}

	drawCoins(world, time, cameraX) {
		const context = this.context;

		for (const coin of world.coinItems) {
			if (coin.taken || coin.x < cameraX - TILE || coin.x > cameraX + VIEW_WIDTH + TILE) {
				continue;
			}

			const spin = Math.cos(time * 4 + coin.x * 0.05);
			const y = coin.y + Math.sin(time * 3 + coin.x) * 2;

			context.save();
			context.translate(coin.x, y);
			context.scale(Math.max(0.15, Math.abs(spin)), 1);
			context.shadowColor = "rgba(255, 207, 63, 0.7)";
			context.shadowBlur = 10;
			context.fillStyle = palette.gold;
			context.beginPath();
			context.arc(0, 0, 11, 0, Math.PI * 2);
			context.fill();
			context.shadowBlur = 0;
			context.strokeStyle = palette.goldDark;
			context.lineWidth = 2;
			context.stroke();
			context.fillStyle = "#7a5300";
			context.font = `bold 11px ${codeFont}`;
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.fillText("{}", 0, 1);
			context.restore();
		}
		context.textBaseline = "alphabetic";
		context.textAlign = "left";
	}

	drawBugs(world, time, cameraX) {
		const context = this.context;

		for (const bug of world.bugs) {
			if (bug.x < cameraX - 64 || bug.x > cameraX + VIEW_WIDTH + 64) {
				continue;
			}

			const centerX = bug.x + bug.width / 2;
			const bottom = bug.y + bug.height;

			if (!bug.alive) {
				if (bug.squashedAt >= 0 && world.time - bug.squashedAt < 0.6) {
					context.globalAlpha = 1 - (world.time - bug.squashedAt) / 0.6;
					context.fillStyle = palette.red;
					context.beginPath();
					context.ellipse(centerX, bottom - 4, 16, 5, 0, 0, Math.PI * 2);
					context.fill();
					context.globalAlpha = 1;
				}
				continue;
			}

			const direction = bug.vx < 0 ? -1 : 1;
			const step = Math.sin(time * 16 + bug.x * 0.1);

			context.strokeStyle = "#1a1a24";
			context.lineWidth = 2;
			for (let leg = -1; leg <= 1; leg++) {
				const legX = centerX + leg * 8;
				const swing = step * (leg === 0 ? -3 : 3);
				context.beginPath();
				context.moveTo(legX, bottom - 8);
				context.lineTo(legX + swing - 3, bottom);
				context.stroke();
			}

			const shell = context.createRadialGradient(centerX - 4, bottom - 16, 2, centerX, bottom - 11, 16);
			shell.addColorStop(0, "#ff9aa9");
			shell.addColorStop(0.5, palette.red);
			shell.addColorStop(1, "#a3203b");
			context.fillStyle = shell;
			context.beginPath();
			context.ellipse(centerX - direction * 2, bottom - 11, 13, 10, 0, 0, Math.PI * 2);
			context.fill();

			context.strokeStyle = "#5c1022";
			context.beginPath();
			context.moveTo(centerX - direction * 2, bottom - 21);
			context.lineTo(centerX - direction * 2, bottom - 3);
			context.stroke();

			context.fillStyle = "#3d0b18";
			for (const [dx, dy] of [[-6, -14], [4, -9], [-5, -6], [5, -16]]) {
				context.beginPath();
				context.arc(centerX - direction * 2 + dx, bottom + dy, 2, 0, Math.PI * 2);
				context.fill();
			}

			const headX = centerX + direction * 12;
			context.fillStyle = "#23232f";
			context.beginPath();
			context.arc(headX, bottom - 10, 7, 0, Math.PI * 2);
			context.fill();

			context.strokeStyle = "#23232f";
			context.lineWidth = 1.5;
			context.beginPath();
			context.moveTo(headX, bottom - 16);
			context.quadraticCurveTo(headX + direction * 6, bottom - 26, headX + direction * 10, bottom - 24);
			context.stroke();

			context.fillStyle = "#ffffff";
			context.beginPath();
			context.arc(headX + direction * 3, bottom - 12, 3, 0, Math.PI * 2);
			context.fill();
			context.fillStyle = "#111111";
			context.beginPath();
			context.arc(headX + direction * 4, bottom - 12, 1.5, 0, Math.PI * 2);
			context.fill();
		}
	}

	drawPlayer(world, time) {
		const player = world.player;

		if ((world.status === "winning" || world.status === "won") && player.x + player.width / 2 > doorX) {
			return;
		}

		const context = this.context;
		const sprite = this.turbotuga;
		const centerX = player.x + player.width / 2;
		const bottom = player.y + player.height;
		const dying = world.status === "dying";
		const walking = player.onGround && Math.abs(player.vx) > 20;
		const landing = world.time - player.landedAt < 0.12 ? 1 - (world.time - player.landedAt) / 0.12 : 0;
		const stretch = player.onGround ? 1 - landing * 0.12 : 1 + Math.min(0.1, Math.abs(player.vy) / 6000);
		const squeeze = 2 - stretch;
		const bob = walking ? Math.abs(Math.sin(time * 18)) * 2 : Math.sin(time * 3) * 0.6;

		context.save();
		context.translate(centerX, bottom);

		if (dying) {
			context.rotate(Math.min(Math.PI, world.statusTime * 8));
		}

		context.scale(player.facing * squeeze, stretch);

		const footY = -4;
		const phase = walking ? Math.sin(time * 18) : 0;
		const tucked = !player.onGround && !dying;
		context.fillStyle = "#4f9a1a";
		for (const side of [-1, 1]) {
			const footX = side * 7 + (walking ? phase * side * 4 : 0);
			context.beginPath();
			context.ellipse(footX, footY - (tucked ? 4 : 0), 7, 4.5, 0, 0, Math.PI * 2);
			context.fill();
		}
		context.fillStyle = "#7bd12b";
		for (const side of [-1, 1]) {
			const footX = side * 7 + (walking ? phase * side * 4 : 0);
			context.beginPath();
			context.ellipse(footX + 1, footY - 1 - (tucked ? 4 : 0), 5, 2.5, 0, 0, Math.PI * 2);
			context.fill();
		}

		this.drawTurbotuga(-sprite.width / 2, -sprite.height - 6 - bob, sprite.width, sprite.height);
		context.restore();
	}

	drawTurbotuga(x, y, width, height) {
		const { image, crop } = this.turbotuga;
		this.context.imageSmoothingQuality = "high";
		this.context.drawImage(image, crop.x, crop.y, crop.width, crop.height, x, y, width, height);
	}

	drawParticles(effects) {
		const context = this.context;

		for (const particle of effects.particles) {
			context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
			context.fillStyle = particle.color;
			context.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
		}

		context.font = `10px ${hudFont}`;
		context.textAlign = "center";
		for (const popup of effects.popups) {
			context.globalAlpha = Math.min(1, popup.life / popup.maxLife * 2);
			context.fillStyle = "rgba(0, 0, 0, 0.6)";
			context.fillText(popup.text, popup.x + 2, popup.y + 2);
			context.fillStyle = popup.color;
			context.fillText(popup.text, popup.x, popup.y);
		}
		context.globalAlpha = 1;
		context.textAlign = "left";
	}

	drawBubble(world, scene) {
		const bubble = scene.bubble;
		if (!bubble || world.status !== "playing") {
			return;
		}

		const age = scene.time - bubble.since;
		const alpha = bubble.thinking ? Math.min(1, age * 4) : Math.max(0, Math.min(1, age * 6, (bubble.until - scene.time) * 3));
		if (alpha <= 0) {
			return;
		}

		const context = this.context;
		const player = world.player;
		const text = bubble.dots ? `${bubble.text}${".".repeat(1 + (Math.floor(scene.time * 3) % 3))}` : bubble.text;

		context.font = `10px ${hudFont}`;
		const width = Math.max(context.measureText(bubble.dots ? `${bubble.text}...` : text).width + 50, 120);
		const x = Math.round(player.x + player.width / 2 - width / 2);
		const pop = bubble.thinking ? 0 : Math.max(0, 1 - age * 5) * 6;
		const y = Math.round(player.y - 84 - pop);

		context.globalAlpha = alpha;
		context.fillStyle = bubble.thinking ? "rgba(20, 26, 52, 0.95)" : "rgba(10, 14, 30, 0.96)";
		roundedRect(context, x, y, width, 34, 10);
		context.fill();
		context.beginPath();
		context.moveTo(x + width / 2 - 7, y + 33);
		context.lineTo(x + width / 2, y + 42);
		context.lineTo(x + width / 2 + 7, y + 33);
		context.fill();
		context.strokeStyle = bubble.color;
		context.lineWidth = 2;
		roundedRect(context, x, y, width, 34, 10);
		context.stroke();

		context.font = "16px system-ui, sans-serif";
		context.fillText(bubble.icon, x + 10, y + 23);
		context.font = `10px ${hudFont}`;
		context.fillStyle = bubble.color;
		context.fillText(text, x + 36, y + 22);
		context.globalAlpha = 1;
	}

	drawHud(world, scene) {
		const context = this.context;

		const gradient = context.createLinearGradient(0, 0, 0, 56);
		gradient.addColorStop(0, "rgba(5, 8, 20, 0.85)");
		gradient.addColorStop(1, "rgba(5, 8, 20, 0)");
		context.fillStyle = gradient;
		context.fillRect(0, 0, VIEW_WIDTH, 56);

		this.drawTurbotuga(16, 8, 26, 28);
		context.font = `12px ${hudFont}`;
		context.fillStyle = "#ffffff";
		context.fillText(`x${Math.max(world.lives, 0)}`, 46, 29);

		context.fillStyle = palette.gold;
		context.beginPath();
		context.arc(112, 23, 9, 0, Math.PI * 2);
		context.fill();
		context.fillStyle = "#7a5300";
		context.font = `bold 9px ${codeFont}`;
		context.textAlign = "center";
		context.fillText("{}", 112, 26);
		context.textAlign = "left";
		context.font = `12px ${hudFont}`;
		context.fillStyle = "#ffffff";
		context.fillText(`x${String(world.coins).padStart(2, "0")}`, 126, 29);

		context.fillStyle = "#8a96c4";
		context.font = `8px ${hudFont}`;
		context.fillText("SCORE", 200, 17);
		context.fillStyle = "#ffffff";
		context.font = `12px ${hudFont}`;
		context.fillText(String(world.score).padStart(6, "0"), 200, 33);

		const progress = progressPercent(world);
		const barX = 320;
		const barWidth = 220;
		context.fillStyle = "#8a96c4";
		context.font = `8px ${hudFont}`;
		context.fillText(`BUILD ${progress}%`, barX, 17);
		context.fillStyle = "rgba(255, 255, 255, 0.1)";
		roundedRect(context, barX, 23, barWidth, 10, 5);
		context.fill();
		context.fillStyle = palette.lime;
		roundedRect(context, barX, 23, Math.max(10, (barWidth * progress) / 100), 10, 5);
		context.fill();

		const label = scene.mode === "system-one" ? "SYSTEM ONE" : "HUMAN";
		const color = scene.mode === "system-one" ? palette.cyan : palette.lime;
		context.font = `9px ${hudFont}`;
		const labelWidth = context.measureText(label).width + 40;
		context.fillStyle = "rgba(10, 14, 30, 0.9)";
		roundedRect(context, VIEW_WIDTH - labelWidth - 16, 10, labelWidth, 26, 13);
		context.fill();
		context.strokeStyle = color;
		context.lineWidth = 2;
		context.stroke();
		context.fillStyle = color;
		context.beginPath();
		context.arc(VIEW_WIDTH - labelWidth + 1, 23, 4 + Math.sin(scene.time * 5), 0, Math.PI * 2);
		context.fill();
		context.fillText(label, VIEW_WIDTH - labelWidth + 12, 27);

		if (scene.mode === "system-one") {
			context.fillStyle = "#8a96c4";
			context.font = `8px ${hudFont}`;
			context.textAlign = "right";
			context.fillText(`TURN ${scene.turn}`, VIEW_WIDTH - 18, 52);
			context.textAlign = "left";
		}
	}
}
