import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ["tests/**/infrastructure/**/*.spec.ts"],
		setupFiles: ["tests/setupTests.ts"],
		fileParallelism: false,
		pool: "forks",
		testTimeout: 30000,
		hookTimeout: 30000,
	},
});
