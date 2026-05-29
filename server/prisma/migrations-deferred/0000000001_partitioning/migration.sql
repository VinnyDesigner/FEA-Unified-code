-- 0001_partitioning: enable pg_partman and convert time-series tables to weekly partitions
-- Run AFTER 0000000000_init has been applied.
-- Idempotent where possible (DROP TABLE IF EXISTS / CREATE EXTENSION IF NOT EXISTS).
--
-- To apply manually:
--   psql $DATABASE_URL -f prisma/migrations/0000000001_partitioning/migration.sql
-- Then register with Prisma:
--   npx prisma migrate resolve --applied 0000000001_partitioning
--
-- IMPORTANT: Never run `prisma db pull` after this migration — partitioned tables
-- will be regenerated as non-partitioned, silently breaking the storage layout.

-- ---------------------------------------------------------------------------
-- 0. Enable pg_partman extension
-- ---------------------------------------------------------------------------
-- pg_partman must be in shared_preload_libraries or installed as an extension.
-- On Ubuntu: apt install postgresql-16-partman
-- On Render paid tier: available by default.
-- Render free tier: NOT available — use manual partition creation script instead.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_partman'
  ) THEN
    RAISE WARNING 'pg_partman extension is NOT available on this Postgres instance. '
      'Skipping partition setup. Install pg_partman or use manual partition creation '
      'script (server/scripts/create-next-partition.js).';
  END IF;
END
$$;

CREATE EXTENSION IF NOT EXISTS pg_partman;

-- ---------------------------------------------------------------------------
-- Helper notes:
-- Since the init migration just ran, all observation tables are empty.
-- We drop and recreate each as PARTITION BY RANGE on its timestamp column.
-- Composite indexes are recreated after the partition shell is created.
-- partman.create_parent() creates the first set of partitions (p_premake => 4 weeks ahead).
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- AQMS: aqms_ambient_air_quality_observations
-- ===========================================================================
DROP TABLE IF EXISTS aqms_ambient_air_quality_observations CASCADE;

CREATE TABLE aqms_ambient_air_quality_observations (
  "AmbientObservationID" BIGSERIAL,
  "StationID"            INTEGER      NOT NULL,
  "ParameterID"          INTEGER      NOT NULL,
  "DateTime"             TIMESTAMPTZ  NOT NULL,
  "Value"                DECIMAL(12,4) NOT NULL,
  "UnitID"               INTEGER      NOT NULL,
  PRIMARY KEY ("AmbientObservationID", "DateTime")
) PARTITION BY RANGE ("DateTime");

CREATE INDEX idx_aqms_ambient_obs_station_param_dt
  ON aqms_ambient_air_quality_observations ("StationID", "ParameterID", "DateTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.aqms_ambient_air_quality_observations',
  p_control      => 'DateTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.aqms_ambient_air_quality_observations';

-- ===========================================================================
-- AQMS: aqms_meteorological_observations
-- ===========================================================================
DROP TABLE IF EXISTS aqms_meteorological_observations CASCADE;

CREATE TABLE aqms_meteorological_observations (
  "MetObservationID" BIGSERIAL,
  "StationID"        INTEGER      NOT NULL,
  "ParameterID"      INTEGER      NOT NULL,
  "DateTime"         TIMESTAMPTZ  NOT NULL,
  "Value"            DECIMAL(12,4) NOT NULL,
  "UnitID"           INTEGER      NOT NULL,
  PRIMARY KEY ("MetObservationID", "DateTime")
) PARTITION BY RANGE ("DateTime");

CREATE INDEX idx_aqms_met_obs_station_param_dt
  ON aqms_meteorological_observations ("StationID", "ParameterID", "DateTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.aqms_meteorological_observations',
  p_control      => 'DateTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.aqms_meteorological_observations';

-- ===========================================================================
-- AQMS: aqms_cems_air_quality_observations
-- ===========================================================================
DROP TABLE IF EXISTS aqms_cems_air_quality_observations CASCADE;

CREATE TABLE aqms_cems_air_quality_observations (
  "CEMSObservationID" BIGSERIAL,
  "StationID"         INTEGER      NOT NULL,
  "ParameterID"       INTEGER      NOT NULL,
  "DateTime"          TIMESTAMPTZ  NOT NULL,
  "Value"             DECIMAL(12,4) NOT NULL,
  "UnitID"            INTEGER      NOT NULL,
  PRIMARY KEY ("CEMSObservationID", "DateTime")
) PARTITION BY RANGE ("DateTime");

CREATE INDEX idx_aqms_cems_obs_station_param_dt
  ON aqms_cems_air_quality_observations ("StationID", "ParameterID", "DateTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.aqms_cems_air_quality_observations',
  p_control      => 'DateTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.aqms_cems_air_quality_observations';

-- ===========================================================================
-- AQMS: aqms_air_quality_index_hourly_stats
-- ===========================================================================
DROP TABLE IF EXISTS aqms_air_quality_index_hourly_stats CASCADE;

CREATE TABLE aqms_air_quality_index_hourly_stats (
  "AirQualityIndexID"  BIGSERIAL,
  "StationID"          INTEGER     NOT NULL,
  "DateTime"           TIMESTAMPTZ NOT NULL,
  "AvgValue"           INTEGER     NOT NULL,
  "MaxValue"           INTEGER     NOT NULL,
  "MinValue"           INTEGER     NOT NULL,
  "Notes"              TEXT,
  "DominantPollutantID" INTEGER    NOT NULL,
  "IndexID"            INTEGER     NOT NULL,
  PRIMARY KEY ("AirQualityIndexID", "DateTime")
) PARTITION BY RANGE ("DateTime");

CREATE INDEX idx_aqms_aqi_hourly_station_dt
  ON aqms_air_quality_index_hourly_stats ("StationID", "DateTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.aqms_air_quality_index_hourly_stats',
  p_control      => 'DateTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.aqms_air_quality_index_hourly_stats';

-- ===========================================================================
-- AQMS: aqms_ambient_air_quality_hourly_stats
-- ===========================================================================
DROP TABLE IF EXISTS aqms_ambient_air_quality_hourly_stats CASCADE;

CREATE TABLE aqms_ambient_air_quality_hourly_stats (
  "ID"          BIGSERIAL,
  "StationID"   INTEGER      NOT NULL,
  "DateTime"    TIMESTAMPTZ  NOT NULL,
  "AvgValue"    DECIMAL(12,4) NOT NULL,
  "MaxValue"    DECIMAL(12,4) NOT NULL,
  "MinValue"    DECIMAL(12,4) NOT NULL,
  "UnitID"      INTEGER      NOT NULL,
  "ParameterID" INTEGER      NOT NULL,
  PRIMARY KEY ("ID", "DateTime")
) PARTITION BY RANGE ("DateTime");

CREATE INDEX idx_aqms_ambient_hourly_station_param_dt
  ON aqms_ambient_air_quality_hourly_stats ("StationID", "ParameterID", "DateTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.aqms_ambient_air_quality_hourly_stats',
  p_control      => 'DateTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.aqms_ambient_air_quality_hourly_stats';

-- ===========================================================================
-- AQMS: aqms_meteorological_hourly_stats
-- ===========================================================================
DROP TABLE IF EXISTS aqms_meteorological_hourly_stats CASCADE;

CREATE TABLE aqms_meteorological_hourly_stats (
  "ID"          BIGSERIAL,
  "StationID"   INTEGER      NOT NULL,
  "DateTime"    TIMESTAMPTZ  NOT NULL,
  "AvgValue"    DECIMAL(12,4) NOT NULL,
  "MaxValue"    DECIMAL(12,4) NOT NULL,
  "MinValue"    DECIMAL(12,4) NOT NULL,
  "UnitID"      INTEGER      NOT NULL,
  "ParameterID" INTEGER      NOT NULL,
  PRIMARY KEY ("ID", "DateTime")
) PARTITION BY RANGE ("DateTime");

CREATE INDEX idx_aqms_met_hourly_station_param_dt
  ON aqms_meteorological_hourly_stats ("StationID", "ParameterID", "DateTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.aqms_meteorological_hourly_stats',
  p_control      => 'DateTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.aqms_meteorological_hourly_stats';

-- ===========================================================================
-- AQMS: aqms_data_completeness_hourly_stats
-- ===========================================================================
DROP TABLE IF EXISTS aqms_data_completeness_hourly_stats CASCADE;

CREATE TABLE aqms_data_completeness_hourly_stats (
  "DataCompletenessID"       BIGSERIAL,
  "StationID"                INTEGER      NOT NULL,
  "ParameterID"              INTEGER      NOT NULL,
  "DataFrequency"            VARCHAR(40)  NOT NULL,
  "DateTime"                 TIMESTAMPTZ  NOT NULL,
  "NumberOfValidRecords"     INTEGER      NOT NULL,
  "NumberOfOutageRecords"    INTEGER      NOT NULL,
  "NumberOfPotentialRecords" INTEGER      NOT NULL,
  "PercentAvailability"      DECIMAL(5,2) NOT NULL,
  "PercentValidRecords"      DECIMAL(5,2) NOT NULL,
  PRIMARY KEY ("DataCompletenessID", "DateTime")
) PARTITION BY RANGE ("DateTime");

CREATE INDEX idx_aqms_data_comp_hourly_station_param_dt
  ON aqms_data_completeness_hourly_stats ("StationID", "ParameterID", "DateTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.aqms_data_completeness_hourly_stats',
  p_control      => 'DateTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.aqms_data_completeness_hourly_stats';

-- ===========================================================================
-- AQMS: aqms_flagged_observations
-- Polymorphic FK: exactly one of ambientObservationId, metObservationId,
-- cemsObservationId must be non-null (CHECK constraint).
-- ===========================================================================
DROP TABLE IF EXISTS aqms_flagged_observations CASCADE;

CREATE TABLE aqms_flagged_observations (
  "DataFlagID"           BIGSERIAL   PRIMARY KEY,
  "AmbientObservationID" BIGINT,
  "MetObservationID"     BIGINT,
  "CEMSObservationID"    BIGINT,
  "FlagID"               INTEGER     NOT NULL,
  "FlagValue"            DECIMAL(12,4),
  "FlagReason"           TEXT        NOT NULL,
  "Notes"                TEXT,
  CONSTRAINT chk_flagged_obs_exactly_one_fk CHECK (
    (
      ("AmbientObservationID" IS NOT NULL)::int +
      ("MetObservationID"     IS NOT NULL)::int +
      ("CEMSObservationID"    IS NOT NULL)::int
    ) = 1
  )
);

CREATE INDEX idx_aqms_flagged_obs_ambient  ON aqms_flagged_observations ("AmbientObservationID");
CREATE INDEX idx_aqms_flagged_obs_met      ON aqms_flagged_observations ("MetObservationID");
CREATE INDEX idx_aqms_flagged_obs_cems     ON aqms_flagged_observations ("CEMSObservationID");

-- ===========================================================================
-- AQMS: aqms_data_violation_logs
-- Same polymorphic pattern as aqms_flagged_observations.
-- ===========================================================================
DROP TABLE IF EXISTS aqms_data_violation_logs CASCADE;

CREATE TABLE aqms_data_violation_logs (
  "ViolationID"          BIGSERIAL   PRIMARY KEY,
  "AmbientObservationID" BIGINT,
  "MetObservationID"     BIGINT,
  "CEMSObservationID"    BIGINT,
  "StationID"            INTEGER     NOT NULL,
  "ParameterID"          INTEGER     NOT NULL,
  "ThresholdID"          INTEGER     NOT NULL,
  "Status"               VARCHAR(20) NOT NULL,
  "Remarks"              TEXT,
  CONSTRAINT chk_violation_log_exactly_one_fk CHECK (
    (
      ("AmbientObservationID" IS NOT NULL)::int +
      ("MetObservationID"     IS NOT NULL)::int +
      ("CEMSObservationID"    IS NOT NULL)::int
    ) = 1
  )
);

CREATE INDEX idx_aqms_violation_log_station_param
  ON aqms_data_violation_logs ("StationID", "ParameterID");

-- ===========================================================================
-- AQMS: aqms_calibration_data (partition on StartDate)
-- ===========================================================================
DROP TABLE IF EXISTS aqms_calibration_data CASCADE;

CREATE TABLE aqms_calibration_data (
  "CalibrationDataID"    BIGSERIAL,
  "CalibrationSequenceID" INTEGER    NOT NULL,
  "ExpectedValue"        DECIMAL(12,4) NOT NULL,
  "Value"                DECIMAL(12,4) NOT NULL,
  "StartDate"            TIMESTAMPTZ  NOT NULL,
  "EndDate"              TIMESTAMPTZ  NOT NULL,
  "ExcludeFromReporting" BOOLEAN      NOT NULL,
  PRIMARY KEY ("CalibrationDataID", "StartDate")
) PARTITION BY RANGE ("StartDate");

CREATE INDEX idx_aqms_calibration_data_seq
  ON aqms_calibration_data ("CalibrationSequenceID");

SELECT partman.create_parent(
  p_parent_table => 'public.aqms_calibration_data',
  p_control      => 'StartDate',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.aqms_calibration_data';

-- ===========================================================================
-- AQMS: aqms_notification_logs (partition on created_at — no ts col; use surrogate)
-- NotificationLog doesn't have a timestamp in the Prisma model;
-- we add a created_at column for partitioning only (default now()).
-- ===========================================================================
DROP TABLE IF EXISTS aqms_notification_logs CASCADE;

CREATE TABLE aqms_notification_logs (
  "NotificationID"     BIGSERIAL,
  "NotificationTypeID" INTEGER      NOT NULL,
  "UserID"             INTEGER      NOT NULL,
  "Priority"           VARCHAR(20)  NOT NULL,
  "Subject"            VARCHAR(255) NOT NULL,
  "Message"            TEXT         NOT NULL,
  "NotificationStatus" VARCHAR(20)  NOT NULL,
  "CreatedAt"          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY ("NotificationID", "CreatedAt")
) PARTITION BY RANGE ("CreatedAt");

CREATE INDEX idx_aqms_notif_log_user_type
  ON aqms_notification_logs ("UserID", "NotificationTypeID");

SELECT partman.create_parent(
  p_parent_table => 'public.aqms_notification_logs',
  p_control      => 'CreatedAt',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '2 years', retention_keep_table = true
  WHERE parent_table = 'public.aqms_notification_logs';

-- ===========================================================================
-- MWQ: mwq_sonde_observations
-- ===========================================================================
DROP TABLE IF EXISTS mwq_sonde_observations CASCADE;

CREATE TABLE mwq_sonde_observations (
  "ObservationID"   BIGSERIAL,
  "BuoySensorID"    INTEGER      NOT NULL,
  "ObservationTime" TIMESTAMPTZ  NOT NULL,
  "ParameterID"     INTEGER      NOT NULL,
  "Value"           DECIMAL(12,4) NOT NULL,
  "BuoyID"          INTEGER      NOT NULL,
  "SensorID"        INTEGER      NOT NULL,
  PRIMARY KEY ("ObservationID", "ObservationTime")
) PARTITION BY RANGE ("ObservationTime");

CREATE INDEX idx_mwq_sonde_obs_buoy_param_dt
  ON mwq_sonde_observations ("BuoyID", "ParameterID", "ObservationTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.mwq_sonde_observations',
  p_control      => 'ObservationTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.mwq_sonde_observations';

-- ===========================================================================
-- MWQ: mwq_weather_observations
-- ===========================================================================
DROP TABLE IF EXISTS mwq_weather_observations CASCADE;

CREATE TABLE mwq_weather_observations (
  "ObservationID"   BIGSERIAL,
  "BuoySensorID"    INTEGER      NOT NULL,
  "ObservationTime" TIMESTAMPTZ  NOT NULL,
  "ParameterID"     INTEGER      NOT NULL,
  "Value"           DECIMAL(12,4) NOT NULL,
  "BuoyID"          INTEGER      NOT NULL,
  "SensorID"        INTEGER      NOT NULL,
  PRIMARY KEY ("ObservationID", "ObservationTime")
) PARTITION BY RANGE ("ObservationTime");

CREATE INDEX idx_mwq_weather_obs_buoy_param_dt
  ON mwq_weather_observations ("BuoyID", "ParameterID", "ObservationTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.mwq_weather_observations',
  p_control      => 'ObservationTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.mwq_weather_observations';

-- ===========================================================================
-- MWQ: mwq_gps_observations
-- ===========================================================================
DROP TABLE IF EXISTS mwq_gps_observations CASCADE;

CREATE TABLE mwq_gps_observations (
  "ObservationID"   BIGSERIAL,
  "BuoySensorID"    INTEGER      NOT NULL,
  "ObservationTime" TIMESTAMPTZ  NOT NULL,
  "ParameterID"     INTEGER      NOT NULL,
  "Value"           DECIMAL(12,4) NOT NULL,
  "BuoyID"          INTEGER      NOT NULL,
  "SensorID"        INTEGER      NOT NULL,
  PRIMARY KEY ("ObservationID", "ObservationTime")
) PARTITION BY RANGE ("ObservationTime");

CREATE INDEX idx_mwq_gps_obs_buoy_param_dt
  ON mwq_gps_observations ("BuoyID", "ParameterID", "ObservationTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.mwq_gps_observations',
  p_control      => 'ObservationTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.mwq_gps_observations';

-- ===========================================================================
-- MWQ: mwq_battery_observations
-- ===========================================================================
DROP TABLE IF EXISTS mwq_battery_observations CASCADE;

CREATE TABLE mwq_battery_observations (
  "ObservationID"   BIGSERIAL,
  "BuoySensorID"    INTEGER      NOT NULL,
  "ObservationTime" TIMESTAMPTZ  NOT NULL,
  "ParameterID"     INTEGER      NOT NULL,
  "Value"           DECIMAL(12,4) NOT NULL,
  "BuoyID"          INTEGER      NOT NULL,
  "SensorID"        INTEGER      NOT NULL,
  PRIMARY KEY ("ObservationID", "ObservationTime")
) PARTITION BY RANGE ("ObservationTime");

CREATE INDEX idx_mwq_battery_obs_buoy_param_dt
  ON mwq_battery_observations ("BuoyID", "ParameterID", "ObservationTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.mwq_battery_observations',
  p_control      => 'ObservationTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.mwq_battery_observations';

-- ===========================================================================
-- MWQ: mwq_door_observations
-- ===========================================================================
DROP TABLE IF EXISTS mwq_door_observations CASCADE;

CREATE TABLE mwq_door_observations (
  "ObservationID"   BIGSERIAL,
  "BuoySensorID"    INTEGER      NOT NULL,
  "ObservationTime" TIMESTAMPTZ  NOT NULL,
  "ParameterID"     INTEGER      NOT NULL,
  "Value"           DECIMAL(12,4) NOT NULL,
  "BuoyID"          INTEGER      NOT NULL,
  "SensorID"        INTEGER      NOT NULL,
  PRIMARY KEY ("ObservationID", "ObservationTime")
) PARTITION BY RANGE ("ObservationTime");

CREATE INDEX idx_mwq_door_obs_buoy_param_dt
  ON mwq_door_observations ("BuoyID", "ParameterID", "ObservationTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.mwq_door_observations',
  p_control      => 'ObservationTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.mwq_door_observations';

-- ===========================================================================
-- MWQ: mwq_data_capture_rates_hourly (partition on Date)
-- ===========================================================================
DROP TABLE IF EXISTS mwq_data_capture_rates_hourly CASCADE;

CREATE TABLE mwq_data_capture_rates_hourly (
  "CaptureRateID"             SERIAL,
  "BuoySensorID"              INTEGER      NOT NULL,
  "ParameterID"               INTEGER      NOT NULL,
  "Date"                      TIMESTAMPTZ  NOT NULL,
  "ExpectedRecords"           INTEGER      NOT NULL,
  "ReceivedRecords"           INTEGER      NOT NULL,
  "ValidRecords"              INTEGER      NOT NULL,
  "CaptureRatePercentage"     DECIMAL(5,2) NOT NULL,
  "ValidCaptureRatePercentage" DECIMAL(5,2) NOT NULL,
  "BuoyID"                    INTEGER      NOT NULL,
  "SensorID"                  INTEGER      NOT NULL,
  PRIMARY KEY ("CaptureRateID", "Date")
) PARTITION BY RANGE ("Date");

SELECT partman.create_parent(
  p_parent_table => 'public.mwq_data_capture_rates_hourly',
  p_control      => 'Date',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '2 years', retention_keep_table = true
  WHERE parent_table = 'public.mwq_data_capture_rates_hourly';

-- ===========================================================================
-- MWQ: mwq_hourly_summaries
-- ===========================================================================
DROP TABLE IF EXISTS mwq_hourly_summaries CASCADE;

CREATE TABLE mwq_hourly_summaries (
  "HourlySummaryID" BIGSERIAL,
  "BuoySensorID"    INTEGER      NOT NULL,
  "ParameterID"     INTEGER      NOT NULL,
  "DateTime"        TIMESTAMPTZ  NOT NULL,
  "AvgValue"        DECIMAL(12,4) NOT NULL,
  "MinValue"        DECIMAL(12,4) NOT NULL,
  "MaxValue"        DECIMAL(12,4) NOT NULL,
  "BuoyID"          INTEGER      NOT NULL,
  "SensorID"        INTEGER      NOT NULL,
  PRIMARY KEY ("HourlySummaryID", "DateTime")
) PARTITION BY RANGE ("DateTime");

CREATE INDEX idx_mwq_hourly_summ_buoy_param_dt
  ON mwq_hourly_summaries ("BuoyID", "ParameterID", "DateTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.mwq_hourly_summaries',
  p_control      => 'DateTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.mwq_hourly_summaries';

-- ===========================================================================
-- MWQ: mwq_logger_runtime_statuses (partition on Timestamp)
-- ===========================================================================
DROP TABLE IF EXISTS mwq_logger_runtime_statuses CASCADE;

CREATE TABLE mwq_logger_runtime_statuses (
  "StatusID"           BIGSERIAL,
  "LoggerID"           INTEGER     NOT NULL,
  "Timestamp"          TIMESTAMPTZ NOT NULL,
  "WatchdogErrors"     INTEGER     NOT NULL,
  "ProgErrors"         INTEGER     NOT NULL,
  "VarOutOfBound"      INTEGER     NOT NULL,
  "SkippedScan"        INTEGER     NOT NULL,
  "ProgramName"        VARCHAR(120) NOT NULL,
  "SkippedSlowScan"    INTEGER     NOT NULL,
  "SerialFlashErrors"  INTEGER     NOT NULL,
  "WiFiUpdateRequired" BOOLEAN     NOT NULL,
  "SW12Volts"          DECIMAL(5,2) NOT NULL,
  "CommsMemFree"       INTEGER     NOT NULL,
  PRIMARY KEY ("StatusID", "Timestamp")
) PARTITION BY RANGE ("Timestamp");

CREATE INDEX idx_mwq_logger_runtime_logger_ts
  ON mwq_logger_runtime_statuses ("LoggerID", "Timestamp" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.mwq_logger_runtime_statuses',
  p_control      => 'Timestamp',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '2 years', retention_keep_table = true
  WHERE parent_table = 'public.mwq_logger_runtime_statuses';

-- ===========================================================================
-- MWQ: mwq_station_alerts (partition on AlertTime)
-- ===========================================================================
DROP TABLE IF EXISTS mwq_station_alerts CASCADE;

CREATE TABLE mwq_station_alerts (
  "AlertID"       BIGSERIAL,
  "BuoyID"        INTEGER      NOT NULL,
  "SensorID"      INTEGER      NOT NULL,
  "AlertMasterID" INTEGER      NOT NULL,
  "AlertTime"     TIMESTAMPTZ  NOT NULL,
  "AlertStatus"   VARCHAR(20)  NOT NULL,
  "ResolvedTime"  TIMESTAMPTZ,
  "AlertValue"    DECIMAL(12,4),
  "Remarks"       TEXT,
  PRIMARY KEY ("AlertID", "AlertTime")
) PARTITION BY RANGE ("AlertTime");

CREATE INDEX idx_mwq_station_alerts_buoy_dt
  ON mwq_station_alerts ("BuoyID", "AlertTime" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.mwq_station_alerts',
  p_control      => 'AlertTime',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '5 years', retention_keep_table = true
  WHERE parent_table = 'public.mwq_station_alerts';

-- ===========================================================================
-- MWQ: mwq_station_health_metadata (partition on Timestamp)
-- ===========================================================================
DROP TABLE IF EXISTS mwq_station_health_metadata CASCADE;

CREATE TABLE mwq_station_health_metadata (
  "HealthID"        BIGSERIAL,
  "LoggerID"        INTEGER     NOT NULL,
  "Timestamp"       TIMESTAMPTZ NOT NULL,
  "Battery"         DECIMAL(5,2) NOT NULL,
  "PanelTemp"       DECIMAL(5,2) NOT NULL,
  "MemoryFree"      INTEGER     NOT NULL,
  "CPUDriveFree"    INTEGER     NOT NULL,
  "DataStorageSize" INTEGER     NOT NULL,
  "DataStorageFree" INTEGER     NOT NULL,
  "ProcessTime"     INTEGER     NOT NULL,
  "MaxProcessTime"  INTEGER     NOT NULL,
  "MeasureTime"     INTEGER     NOT NULL,
  "FullMemReset"    BOOLEAN     NOT NULL,
  PRIMARY KEY ("HealthID", "Timestamp")
) PARTITION BY RANGE ("Timestamp");

CREATE INDEX idx_mwq_station_health_logger_ts
  ON mwq_station_health_metadata ("LoggerID", "Timestamp" DESC);

SELECT partman.create_parent(
  p_parent_table => 'public.mwq_station_health_metadata',
  p_control      => 'Timestamp',
  p_type         => 'native',
  p_interval     => '1 week',
  p_premake      => 4
);

UPDATE partman.part_config
  SET retention = '2 years', retention_keep_table = true
  WHERE parent_table = 'public.mwq_station_health_metadata';

-- ===========================================================================
-- Maintenance: schedule pg_partman run_maintenance
-- On systems with pg_cron: uncomment and adjust schedule.
-- On Render: use server/scripts/partman-maintenance.js via Render Cron Job.
-- ===========================================================================
-- SELECT cron.schedule('partman-maintenance', '*/30 * * * *',
--   $$CALL partman.run_maintenance_proc()$$);
