-- 1) Extensión TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 2) Creación de la tabla (ahora llamada "pepi")
CREATE TABLE IF NOT EXISTS pepi (
  id_paciente TEXT             NOT NULL,
  fp1          DOUBLE PRECISION NOT NULL,
  fp2          DOUBLE PRECISION NOT NULL,
  t3           DOUBLE PRECISION NOT NULL,
  t4           DOUBLE PRECISION NOT NULL,
  o1           DOUBLE PRECISION NOT NULL,
  o2           DOUBLE PRECISION NOT NULL,
  c3           DOUBLE PRECISION NOT NULL,
  c4           DOUBLE PRECISION NOT NULL,
  evento       BOOLEAN          NOT NULL DEFAULT FALSE,
  ts           TIMESTAMPTZ      NOT NULL
);

-- 3) Hypertable
SELECT create_hypertable('pepi', 'ts', if_not_exists => TRUE);
