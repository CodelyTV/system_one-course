const sounds = {
	jump: [{ type: "square", from: 300, to: 620, duration: 0.14, volume: 0.06 }],
	longJump: [{ type: "square", from: 260, to: 780, duration: 0.2, volume: 0.06 }],
	coin: [
		{ type: "square", from: 988, to: 988, duration: 0.07, volume: 0.05 },
		{ type: "square", from: 1319, to: 1319, duration: 0.18, volume: 0.05, delay: 0.07 },
	],
	reward: [
		{ type: "triangle", from: 523, to: 523, duration: 0.08, volume: 0.09 },
		{ type: "triangle", from: 784, to: 784, duration: 0.08, volume: 0.09, delay: 0.08 },
		{ type: "triangle", from: 1047, to: 1047, duration: 0.16, volume: 0.09, delay: 0.16 },
	],
	stomp: [{ type: "triangle", from: 420, to: 90, duration: 0.16, volume: 0.14 }],
	bump: [{ type: "triangle", from: 160, to: 110, duration: 0.08, volume: 0.1 }],
	death: [
		{ type: "square", from: 494, to: 494, duration: 0.12, volume: 0.06 },
		{ type: "square", from: 466, to: 300, duration: 0.5, volume: 0.06, delay: 0.14 },
	],
	checkpoint: [
		{ type: "triangle", from: 659, to: 659, duration: 0.1, volume: 0.09 },
		{ type: "triangle", from: 988, to: 988, duration: 0.2, volume: 0.09, delay: 0.1 },
	],
	decision: [{ type: "sine", from: 880, to: 1320, duration: 0.09, volume: 0.05 }],
	win: [523, 659, 784, 1047, 784, 1047].map((frequency, index) => ({
		type: "square",
		from: frequency,
		to: frequency,
		duration: 0.14,
		volume: 0.05,
		delay: index * 0.13,
	})),
};

export class Sound {
	constructor() {
		this.context = null;
		this.muted = false;
	}

	unlock() {
		this.context ??= new AudioContext();
		this.context.resume();
	}

	toggle() {
		this.muted = !this.muted;

		return this.muted;
	}

	play(name) {
		if (this.muted || !this.context || !sounds[name]) {
			return;
		}

		const now = this.context.currentTime;

		for (const note of sounds[name]) {
			const start = now + (note.delay ?? 0);
			const oscillator = this.context.createOscillator();
			const gain = this.context.createGain();

			oscillator.type = note.type;
			oscillator.frequency.setValueAtTime(note.from, start);
			oscillator.frequency.exponentialRampToValueAtTime(note.to, start + note.duration);
			gain.gain.setValueAtTime(note.volume, start);
			gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
			oscillator.connect(gain).connect(this.context.destination);
			oscillator.start(start);
			oscillator.stop(start + note.duration + 0.02);
		}
	}
}
