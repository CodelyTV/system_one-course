/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: "node",
	transform: {
		"^.+\\.(t|j)sx?$": "@swc/jest",
	},
	transformIgnorePatterns: [
		"/node_modules/(?!\\.pnpm/@faker-js\\+faker@|@faker-js/faker/)",
	],
};
