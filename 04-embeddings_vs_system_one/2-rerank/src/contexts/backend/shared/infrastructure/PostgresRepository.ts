import type postgres from "postgres";

import type { PostgresConnection } from "./PostgresConnection";

export abstract class PostgresRepository {
	protected readonly sql: postgres.Sql;

	constructor(connection: PostgresConnection) {
		this.sql = connection.sql;
	}
}
