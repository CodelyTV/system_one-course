import postgres from "postgres";

const defaultDatabaseUrl = "postgres://retail:retail@localhost:55432/retail";

export function databaseUrl(): string {
	return process.env.DATABASE_URL ?? defaultDatabaseUrl;
}

export class PostgresConnection {
	readonly sql: postgres.Sql;

	constructor(url: string = databaseUrl()) {
		this.sql = postgres(url, { idle_timeout: 1, max: 5 });
	}
}
