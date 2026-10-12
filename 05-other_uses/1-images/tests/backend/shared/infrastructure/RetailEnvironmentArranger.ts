import type { PostgresConnection } from "@/contexts/backend/shared/infrastructure/PostgresConnection";

export class RetailEnvironmentArranger {
	constructor(private readonly connection: PostgresConnection) {}

	async arrange(): Promise<void> {
		await this.connection.sql.unsafe(`DO
$$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END
$$;`);
	}

	async close(): Promise<void> {
		await this.connection.sql.end({ timeout: 5 });
	}
}
