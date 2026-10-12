import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ["evals/**/*.eval.ts"],
		reporters: ["default"],
		testTimeout: 300000,
		onConsoleLog: (log) => !log.includes("SPAM RESULT"),
	},
});
