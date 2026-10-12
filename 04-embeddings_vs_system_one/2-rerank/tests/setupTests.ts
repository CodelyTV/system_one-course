// Force integration tests to hit the isolated test database, never the dev one.
process.env.DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	"postgres://retail:retail@localhost:55432/retail_test";
