CREATE EXTENSION IF NOT EXISTS jev CASCADE;

DO $$
BEGIN
	EXECUTE format('ALTER DATABASE %I SET jev.api_url = %L', current_database(), 'http://laya:8000/v1/systemone');
	EXECUTE format('ALTER DATABASE %I SET jev.api_key = %L', current_database(), 'courses-laya');
	EXECUTE format('ALTER DATABASE %I SET jev.batch_size = %L', current_database(), '1');
	EXECUTE format('ALTER DATABASE %I SET jev.concurrency = %L', current_database(), '4');
	EXECUTE format('ALTER DATABASE %I SET jev.timeout = %L', current_database(), '120');
END
$$;
