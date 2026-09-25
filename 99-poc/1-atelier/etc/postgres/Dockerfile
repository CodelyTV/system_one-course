ARG PG_MAJOR=18
FROM postgres:${PG_MAJOR}
ARG PG_MAJOR
ARG PG_JEV_COMMIT=afd11fa856d7a2b831a1bfd8ee7f869ce8efcd62
ARG PG_JEV_URL=https://raw.githubusercontent.com/realZachi/pg-jev/${PG_JEV_COMMIT}
RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-plpython3-${PG_MAJOR} ca-certificates \
 && rm -rf /var/lib/apt/lists/*
ADD --chmod=644 ${PG_JEV_URL}/jev.control ${PG_JEV_URL}/sql/jev--0.2.0.sql /usr/share/postgresql/${PG_MAJOR}/extension/
