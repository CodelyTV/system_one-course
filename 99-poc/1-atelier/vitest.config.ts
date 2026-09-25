import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ["tests/**/*.spec.ts"],
		exclude: ["**/node_modules/**", "tests/**/infrastructure/**"],
		mockReset: true,
	},
});
