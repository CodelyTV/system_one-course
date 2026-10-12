import { spawnSync } from "node:child_process";

const maxAttempts = 30;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
	const result = spawnSync(
		"docker",
		[
			"compose",
			"exec",
			"-T",
			"postgres",
			"pg_isready",
			"-U",
			"retail",
			"-d",
			"retail",
		],
		{ encoding: "utf8", stdio: "pipe" },
	);

	if (result.status === 0) {
		process.exit(0);
	}

	// eslint-disable-next-line no-await-in-loop
	await new Promise((resolve) => {
		setTimeout(resolve, 1000);
	});
}

console.error(`Postgres was not ready after ${maxAttempts} seconds`);
process.exit(1);
