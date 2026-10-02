CREATE EXTENSION IF NOT EXISTS jev CASCADE;

DO $$
BEGIN
	EXECUTE format('ALTER DATABASE %I SET jev.api_url = %L', current_database(), 'https://ai-gateway.vercel.sh/typesafe/v1/systemone');
	EXECUTE format('ALTER DATABASE %I SET jev.model = %L', current_database(), 'typesafe-ai/jev');
END
$$;
