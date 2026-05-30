-- =====================================================================
-- FEA Unified — AQMS domain database  (fea_aqms)
-- Air Quality Monitoring System domain tables + per-module operational
-- tables (otps, reports, audit_logs, aqms_notification_logs). Identity/access
-- lives in fea_higher_level.
--
-- These operational tables reference a user by a plain integer "UserID"
-- with NO cross-database foreign key (integrity enforced in app code).
--
-- AUTHORITATIVE SCHEMA = Prisma (server/prisma/aqms/schema). Generated DDL,
-- kept as a standalone reference.
--
--   createdb fea_aqms && psql -d fea_aqms -f 03_aqms.sql
-- =====================================================================

BEGIN;

-- CreateEnum
CREATE TYPE "Module" AS ENUM ('AQMS', 'MWQ');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('XLSX', 'DOCX', 'PDF');

-- CreateEnum
CREATE TYPE "AlarmSeverity" AS ENUM ('INFO', 'WARN', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlarmCode" AS ENUM ('COMM_LOST', 'DOOR_OPEN', 'GPS_LOST', 'BATTERY_LOW', 'SENSOR_FAULT', 'POWER_FAULT', 'THRESHOLD_EXCEEDED', 'OFFLINE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "aqms_monitoring_sites" (
    "StationID" SERIAL NOT NULL,
    "StationCode" VARCHAR(40) NOT NULL,
    "StationName" VARCHAR(120) NOT NULL,
    "Description" TEXT NOT NULL,
    "StationType" VARCHAR(40) NOT NULL,
    "Latitude" DECIMAL(9,6) NOT NULL,
    "Longitude" DECIMAL(9,6) NOT NULL,
    "Street" VARCHAR(255),
    "City" VARCHAR(80),
    "State" VARCHAR(80),
    "ZipCode" VARCHAR(20),
    "AreaType" VARCHAR(40) NOT NULL,
    "OperationalState" VARCHAR(40) NOT NULL,
    "Status" VARCHAR(20) NOT NULL,

    CONSTRAINT "aqms_monitoring_sites_pkey" PRIMARY KEY ("StationID")
);

-- CreateTable
CREATE TABLE "aqms_sensor_details" (
    "AssetID" SERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "SerialNumber" VARCHAR(60) NOT NULL,
    "Manufacturer" VARCHAR(120) NOT NULL,
    "ModelNumber" VARCHAR(120) NOT NULL,
    "InstallationDate" DATE NOT NULL,
    "PurchaseDate" DATE NOT NULL,
    "RetiredDate" DATE,
    "AssetTag" VARCHAR(60) NOT NULL,
    "CertifyingAuthority" VARCHAR(120),
    "CertificationDate" DATE,
    "Owner" VARCHAR(120) NOT NULL,

    CONSTRAINT "aqms_sensor_details_pkey" PRIMARY KEY ("AssetID")
);

-- CreateTable
CREATE TABLE "aqms_sampling_frequencies" (
    "SamplingFrequencyID" SERIAL NOT NULL,
    "FrequencyName" VARCHAR(60) NOT NULL,
    "TimeInterval" VARCHAR(20) NOT NULL,
    "IntervalValue" INTEGER NOT NULL,

    CONSTRAINT "aqms_sampling_frequencies_pkey" PRIMARY KEY ("SamplingFrequencyID")
);

-- CreateTable
CREATE TABLE "aqms_parameter_masters" (
    "ParameterID" SERIAL NOT NULL,
    "ParameterName" VARCHAR(80) NOT NULL,
    "ParameterTypeCode" VARCHAR(40) NOT NULL,
    "UnitID" INTEGER,

    CONSTRAINT "aqms_parameter_masters_pkey" PRIMARY KEY ("ParameterID")
);

-- CreateTable
CREATE TABLE "aqms_measurement_units" (
    "UnitID" SERIAL NOT NULL,
    "UnitType" VARCHAR(40) NOT NULL,
    "ParameterID" INTEGER,
    "UnitName" VARCHAR(60) NOT NULL,
    "Description" TEXT NOT NULL,

    CONSTRAINT "aqms_measurement_units_pkey" PRIMARY KEY ("UnitID")
);

-- CreateTable
CREATE TABLE "aqms_site_parameters" (
    "SiteParameterID" SERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "FrequencyID" INTEGER NOT NULL,

    CONSTRAINT "aqms_site_parameters_pkey" PRIMARY KEY ("SiteParameterID")
);

-- CreateTable
CREATE TABLE "aqms_ambient_air_quality_observations" (
    "AmbientObservationID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "Value" DECIMAL(12,4) NOT NULL,
    "UnitID" INTEGER NOT NULL,

    CONSTRAINT "aqms_ambient_air_quality_observations_pkey" PRIMARY KEY ("AmbientObservationID")
);

-- CreateTable
CREATE TABLE "aqms_meteorological_observations" (
    "MetObservationID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "Value" DECIMAL(12,4) NOT NULL,
    "UnitID" INTEGER NOT NULL,

    CONSTRAINT "aqms_meteorological_observations_pkey" PRIMARY KEY ("MetObservationID")
);

-- CreateTable
CREATE TABLE "aqms_cems_air_quality_observations" (
    "CEMSObservationID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "Value" DECIMAL(12,4) NOT NULL,
    "UnitID" INTEGER NOT NULL,

    CONSTRAINT "aqms_cems_air_quality_observations_pkey" PRIMARY KEY ("CEMSObservationID")
);

-- CreateTable
CREATE TABLE "aqms_aq_parameters_thresholds" (
    "ThresholdID" SERIAL NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "StandardType" VARCHAR(40) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "aqms_aq_parameters_thresholds_pkey" PRIMARY KEY ("ThresholdID")
);

-- CreateTable
CREATE TABLE "aqms_aq_index_masters" (
    "IndexID" SERIAL NOT NULL,
    "IndexMin" INTEGER NOT NULL,
    "IndexMax" INTEGER NOT NULL,
    "Category" VARCHAR(40) NOT NULL,
    "Color" VARCHAR(20) NOT NULL,
    "CategoryDescription" TEXT NOT NULL,

    CONSTRAINT "aqms_aq_index_masters_pkey" PRIMARY KEY ("IndexID")
);

-- CreateTable
CREATE TABLE "aqms_health_advisories" (
    "AdvisoryID" SERIAL NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "IndexID" INTEGER NOT NULL,
    "SensitiveGroups" TEXT NOT NULL,
    "HealthAdvisory" TEXT NOT NULL,

    CONSTRAINT "aqms_health_advisories_pkey" PRIMARY KEY ("AdvisoryID")
);

-- CreateTable
CREATE TABLE "aqms_air_quality_index_hourly_stats" (
    "AirQualityIndexID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "AvgValue" INTEGER NOT NULL,
    "MaxValue" INTEGER NOT NULL,
    "MinValue" INTEGER NOT NULL,
    "Notes" TEXT,
    "DominantPollutantID" INTEGER NOT NULL,
    "IndexID" INTEGER NOT NULL,

    CONSTRAINT "aqms_air_quality_index_hourly_stats_pkey" PRIMARY KEY ("AirQualityIndexID")
);

-- CreateTable
CREATE TABLE "aqms_air_quality_index_daily_stats" (
    "AirQualityIndexID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "AvgValue" INTEGER NOT NULL,
    "MaxValue" INTEGER NOT NULL,
    "MinValue" INTEGER NOT NULL,
    "Notes" TEXT,
    "DominantPollutantID" INTEGER NOT NULL,
    "IndexID" INTEGER NOT NULL,

    CONSTRAINT "aqms_air_quality_index_daily_stats_pkey" PRIMARY KEY ("AirQualityIndexID")
);

-- CreateTable
CREATE TABLE "aqms_air_quality_index_monthly_stats" (
    "AirQualityIndexID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "AvgValue" INTEGER NOT NULL,
    "MaxValue" INTEGER NOT NULL,
    "MinValue" INTEGER NOT NULL,
    "Notes" TEXT,
    "DominantPollutantID" INTEGER NOT NULL,
    "IndexID" INTEGER NOT NULL,

    CONSTRAINT "aqms_air_quality_index_monthly_stats_pkey" PRIMARY KEY ("AirQualityIndexID")
);

-- CreateTable
CREATE TABLE "aqms_air_quality_index_yearly_stats" (
    "AirQualityIndexID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "AvgValue" INTEGER NOT NULL,
    "MaxValue" INTEGER NOT NULL,
    "MinValue" INTEGER NOT NULL,
    "Notes" TEXT,
    "DominantPollutantID" INTEGER NOT NULL,
    "IndexID" INTEGER NOT NULL,

    CONSTRAINT "aqms_air_quality_index_yearly_stats_pkey" PRIMARY KEY ("AirQualityIndexID")
);

-- CreateTable
CREATE TABLE "aqms_ambient_air_quality_hourly_stats" (
    "ID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "UnitID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,

    CONSTRAINT "aqms_ambient_air_quality_hourly_stats_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "aqms_ambient_air_quality_daily_stats" (
    "ID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "UnitID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,

    CONSTRAINT "aqms_ambient_air_quality_daily_stats_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "aqms_ambient_air_quality_monthly_stats" (
    "ID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "Month" INTEGER NOT NULL,
    "Year" INTEGER NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "UnitID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,

    CONSTRAINT "aqms_ambient_air_quality_monthly_stats_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "aqms_meteorological_hourly_stats" (
    "ID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "UnitID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,

    CONSTRAINT "aqms_meteorological_hourly_stats_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "aqms_meteorological_daily_stats" (
    "ID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "UnitID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,

    CONSTRAINT "aqms_meteorological_daily_stats_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "aqms_meteorological_monthly_stats" (
    "ID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "Month" INTEGER NOT NULL,
    "Year" INTEGER NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "UnitID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,

    CONSTRAINT "aqms_meteorological_monthly_stats_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "aqms_cems_air_quality_hourly_stats" (
    "CEMSStatsID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "Date" DATE NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "UnitID" INTEGER NOT NULL,

    CONSTRAINT "aqms_cems_air_quality_hourly_stats_pkey" PRIMARY KEY ("CEMSStatsID")
);

-- CreateTable
CREATE TABLE "aqms_cems_air_quality_daily_stats" (
    "CEMSStatsID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "Date" DATE NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "UnitID" INTEGER NOT NULL,

    CONSTRAINT "aqms_cems_air_quality_daily_stats_pkey" PRIMARY KEY ("CEMSStatsID")
);

-- CreateTable
CREATE TABLE "aqms_cems_air_quality_monthly_stats" (
    "CEMSStatsID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "Date" DATE NOT NULL,
    "Month" INTEGER NOT NULL,
    "Year" INTEGER NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "UnitID" INTEGER NOT NULL,

    CONSTRAINT "aqms_cems_air_quality_monthly_stats_pkey" PRIMARY KEY ("CEMSStatsID")
);

-- CreateTable
CREATE TABLE "aqms_data_completeness_hourly_stats" (
    "DataCompletenessID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "DataFrequency" VARCHAR(40) NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "NumberOfValidRecords" INTEGER NOT NULL,
    "NumberOfOutageRecords" INTEGER NOT NULL,
    "NumberOfPotentialRecords" INTEGER NOT NULL,
    "PercentAvailability" DECIMAL(5,2) NOT NULL,
    "PercentValidRecords" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "aqms_data_completeness_hourly_stats_pkey" PRIMARY KEY ("DataCompletenessID")
);

-- CreateTable
CREATE TABLE "aqms_data_completeness_daily_stats" (
    "DataCompletenessID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "DataFrequency" VARCHAR(40) NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "NumberOfValidRecords" INTEGER NOT NULL,
    "NumberOfOutageRecords" INTEGER NOT NULL,
    "NumberOfPotentialRecords" INTEGER NOT NULL,
    "PercentAvailability" DECIMAL(5,2) NOT NULL,
    "PercentValidRecords" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "aqms_data_completeness_daily_stats_pkey" PRIMARY KEY ("DataCompletenessID")
);

-- CreateTable
CREATE TABLE "aqms_data_completeness_monthly_stats" (
    "DataCompletenessID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "DataFrequency" VARCHAR(40) NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "NumberOfValidRecords" INTEGER NOT NULL,
    "NumberOfOutageRecords" INTEGER NOT NULL,
    "NumberOfPotentialRecords" INTEGER NOT NULL,
    "PercentAvailability" DECIMAL(5,2) NOT NULL,
    "PercentValidRecords" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "aqms_data_completeness_monthly_stats_pkey" PRIMARY KEY ("DataCompletenessID")
);

-- CreateTable
CREATE TABLE "aqms_data_quality_flag_definitions" (
    "FlagID" SERIAL NOT NULL,
    "FlagName" VARCHAR(80) NOT NULL,
    "FlagType" VARCHAR(40) NOT NULL,
    "FlagCode" VARCHAR(20) NOT NULL,
    "Description" TEXT NOT NULL,

    CONSTRAINT "aqms_data_quality_flag_definitions_pkey" PRIMARY KEY ("FlagID")
);

-- CreateTable
CREATE TABLE "aqms_flagged_observations" (
    "DataFlagID" BIGSERIAL NOT NULL,
    "AmbientObservationID" BIGINT,
    "MetObservationID" BIGINT,
    "CEMSObservationID" BIGINT,
    "FlagID" INTEGER NOT NULL,
    "FlagValue" DECIMAL(12,4),
    "FlagReason" TEXT NOT NULL,
    "Notes" TEXT,

    CONSTRAINT "aqms_flagged_observations_pkey" PRIMARY KEY ("DataFlagID")
);

-- CreateTable
CREATE TABLE "aqms_data_violation_logs" (
    "ViolationID" BIGSERIAL NOT NULL,
    "AmbientObservationID" BIGINT,
    "MetObservationID" BIGINT,
    "CEMSObservationID" BIGINT,
    "StationID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "ThresholdID" INTEGER NOT NULL,
    "Status" VARCHAR(20) NOT NULL,
    "Remarks" TEXT,

    CONSTRAINT "aqms_data_violation_logs_pkey" PRIMARY KEY ("ViolationID")
);

-- CreateTable
CREATE TABLE "aqms_calibration_definitions" (
    "CalibrationSequenceID" SERIAL NOT NULL,
    "CalibrationName" VARCHAR(120) NOT NULL,
    "SourceID" VARCHAR(60) NOT NULL,
    "CalibrationType" VARCHAR(40) NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "Enabled" BOOLEAN NOT NULL,
    "PhaseNumber" INTEGER NOT NULL,
    "PhaseName" VARCHAR(80) NOT NULL,
    "CalibrationLevelID" INTEGER NOT NULL,
    "OutOfControlLimit" DECIMAL(12,4) NOT NULL,
    "AutoCorrect" BOOLEAN NOT NULL,
    "DurationType" VARCHAR(40) NOT NULL,
    "ResponseTime" INTEGER NOT NULL,

    CONSTRAINT "aqms_calibration_definitions_pkey" PRIMARY KEY ("CalibrationSequenceID")
);

-- CreateTable
CREATE TABLE "aqms_calibration_data" (
    "CalibrationDataID" BIGSERIAL NOT NULL,
    "CalibrationSequenceID" INTEGER NOT NULL,
    "ExpectedValue" DECIMAL(12,4) NOT NULL,
    "Value" DECIMAL(12,4) NOT NULL,
    "StartDate" TIMESTAMPTZ(6) NOT NULL,
    "EndDate" TIMESTAMPTZ(6) NOT NULL,
    "ExcludeFromReporting" BOOLEAN NOT NULL,

    CONSTRAINT "aqms_calibration_data_pkey" PRIMARY KEY ("CalibrationDataID")
);

-- CreateTable
CREATE TABLE "aqms_wind_rose_logs" (
    "WindRoseID" BIGSERIAL NOT NULL,
    "StationID" INTEGER NOT NULL,
    "ParameterID" INTEGER,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "WindSpeedClass" VARCHAR(40) NOT NULL,
    "AverageWindSpeed" DECIMAL(8,2) NOT NULL,
    "WindDirection" VARCHAR(8) NOT NULL,
    "N" DECIMAL(5,2) NOT NULL,
    "NNE" DECIMAL(5,2) NOT NULL,
    "NE" DECIMAL(5,2) NOT NULL,
    "ENE" DECIMAL(5,2) NOT NULL,
    "E" DECIMAL(5,2) NOT NULL,
    "ESE" DECIMAL(5,2) NOT NULL,
    "SE" DECIMAL(5,2) NOT NULL,
    "SSE" DECIMAL(5,2) NOT NULL,
    "S" DECIMAL(5,2) NOT NULL,
    "SSW" DECIMAL(5,2) NOT NULL,
    "SW" DECIMAL(5,2) NOT NULL,
    "WSW" DECIMAL(5,2) NOT NULL,
    "W" DECIMAL(5,2) NOT NULL,
    "WNW" DECIMAL(5,2) NOT NULL,
    "NW" DECIMAL(5,2) NOT NULL,
    "NNW" DECIMAL(5,2) NOT NULL,
    "Remarks" TEXT,

    CONSTRAINT "aqms_wind_rose_logs_pkey" PRIMARY KEY ("WindRoseID")
);

-- CreateTable
CREATE TABLE "aqms_notification_masters" (
    "NotificationTypeID" SERIAL NOT NULL,
    "NotificationCode" VARCHAR(40) NOT NULL,
    "NotificationName" VARCHAR(120) NOT NULL,
    "SeverityLevel" VARCHAR(20) NOT NULL,
    "Description" TEXT NOT NULL,

    CONSTRAINT "aqms_notification_masters_pkey" PRIMARY KEY ("NotificationTypeID")
);

-- CreateTable
CREATE TABLE "aqms_notification_logs" (
    "NotificationID" BIGSERIAL NOT NULL,
    "NotificationTypeID" INTEGER NOT NULL,
    "UserID" INTEGER NOT NULL,
    "Priority" VARCHAR(20) NOT NULL,
    "Subject" VARCHAR(255) NOT NULL,
    "Message" TEXT NOT NULL,
    "NotificationStatus" VARCHAR(20) NOT NULL,

    CONSTRAINT "aqms_notification_logs_pkey" PRIMARY KEY ("NotificationID")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "CodeHash" VARCHAR(255) NOT NULL,
    "Channel" VARCHAR(20) NOT NULL,
    "ExpiresAt" TIMESTAMPTZ(6) NOT NULL,
    "ConsumedAt" TIMESTAMPTZ(6),
    "AttemptCount" INTEGER NOT NULL DEFAULT 0,
    "IpAddress" VARCHAR(60),
    "CreatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "module" "Module" NOT NULL,
    "ReportType" VARCHAR(40),
    "ParameterIds" INTEGER[],
    "StationIds" INTEGER[],
    "StartDate" TIMESTAMPTZ(6) NOT NULL,
    "EndDate" TIMESTAMPTZ(6) NOT NULL,
    "formats" "ReportFormat"[],
    "StoragePaths" JSONB NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "CreatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CompletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "UserID" INTEGER,
    "Action" VARCHAR(60) NOT NULL,
    "EntityType" VARCHAR(60),
    "EntityId" VARCHAR(60),
    "Changes" JSONB,
    "IpAddress" VARCHAR(60),
    "CreatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aqms_monitoring_sites_StationCode_key" ON "aqms_monitoring_sites"("StationCode");

-- CreateIndex
CREATE INDEX "aqms_sensor_details_StationID_idx" ON "aqms_sensor_details"("StationID");

-- CreateIndex
CREATE INDEX "aqms_site_parameters_StationID_ParameterID_idx" ON "aqms_site_parameters"("StationID", "ParameterID");

-- CreateIndex
CREATE INDEX "aqms_ambient_air_quality_observations_StationID_ParameterID_idx" ON "aqms_ambient_air_quality_observations"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_meteorological_observations_StationID_ParameterID_Date_idx" ON "aqms_meteorological_observations"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_cems_air_quality_observations_StationID_ParameterID_Da_idx" ON "aqms_cems_air_quality_observations"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_aq_parameters_thresholds_ParameterID_idx" ON "aqms_aq_parameters_thresholds"("ParameterID");

-- CreateIndex
CREATE INDEX "aqms_health_advisories_ParameterID_IndexID_idx" ON "aqms_health_advisories"("ParameterID", "IndexID");

-- CreateIndex
CREATE INDEX "aqms_air_quality_index_hourly_stats_StationID_DateTime_idx" ON "aqms_air_quality_index_hourly_stats"("StationID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_air_quality_index_daily_stats_StationID_DateTime_idx" ON "aqms_air_quality_index_daily_stats"("StationID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_air_quality_index_monthly_stats_StationID_DateTime_idx" ON "aqms_air_quality_index_monthly_stats"("StationID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_air_quality_index_yearly_stats_StationID_DateTime_idx" ON "aqms_air_quality_index_yearly_stats"("StationID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_ambient_air_quality_hourly_stats_StationID_ParameterID_idx" ON "aqms_ambient_air_quality_hourly_stats"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_ambient_air_quality_daily_stats_StationID_ParameterID__idx" ON "aqms_ambient_air_quality_daily_stats"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_ambient_air_quality_monthly_stats_StationID_ParameterI_idx" ON "aqms_ambient_air_quality_monthly_stats"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_meteorological_hourly_stats_StationID_ParameterID_Date_idx" ON "aqms_meteorological_hourly_stats"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_meteorological_daily_stats_StationID_ParameterID_DateT_idx" ON "aqms_meteorological_daily_stats"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_meteorological_monthly_stats_StationID_ParameterID_Dat_idx" ON "aqms_meteorological_monthly_stats"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_cems_air_quality_hourly_stats_StationID_ParameterID_Da_idx" ON "aqms_cems_air_quality_hourly_stats"("StationID", "ParameterID", "Date" DESC);

-- CreateIndex
CREATE INDEX "aqms_cems_air_quality_daily_stats_StationID_ParameterID_Dat_idx" ON "aqms_cems_air_quality_daily_stats"("StationID", "ParameterID", "Date" DESC);

-- CreateIndex
CREATE INDEX "aqms_cems_air_quality_monthly_stats_StationID_ParameterID_D_idx" ON "aqms_cems_air_quality_monthly_stats"("StationID", "ParameterID", "Date" DESC);

-- CreateIndex
CREATE INDEX "aqms_data_completeness_hourly_stats_StationID_ParameterID_D_idx" ON "aqms_data_completeness_hourly_stats"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_data_completeness_daily_stats_StationID_ParameterID_Da_idx" ON "aqms_data_completeness_daily_stats"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "aqms_data_completeness_monthly_stats_StationID_ParameterID__idx" ON "aqms_data_completeness_monthly_stats"("StationID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "aqms_data_quality_flag_definitions_FlagCode_key" ON "aqms_data_quality_flag_definitions"("FlagCode");

-- CreateIndex
CREATE INDEX "aqms_flagged_observations_AmbientObservationID_idx" ON "aqms_flagged_observations"("AmbientObservationID");

-- CreateIndex
CREATE INDEX "aqms_flagged_observations_MetObservationID_idx" ON "aqms_flagged_observations"("MetObservationID");

-- CreateIndex
CREATE INDEX "aqms_flagged_observations_CEMSObservationID_idx" ON "aqms_flagged_observations"("CEMSObservationID");

-- CreateIndex
CREATE INDEX "aqms_data_violation_logs_StationID_ParameterID_idx" ON "aqms_data_violation_logs"("StationID", "ParameterID");

-- CreateIndex
CREATE INDEX "aqms_calibration_data_CalibrationSequenceID_idx" ON "aqms_calibration_data"("CalibrationSequenceID");

-- CreateIndex
CREATE INDEX "aqms_wind_rose_logs_StationID_DateTime_idx" ON "aqms_wind_rose_logs"("StationID", "DateTime" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "aqms_notification_masters_NotificationCode_key" ON "aqms_notification_masters"("NotificationCode");

-- CreateIndex
CREATE INDEX "aqms_notification_logs_UserID_NotificationTypeID_idx" ON "aqms_notification_logs"("UserID", "NotificationTypeID");

-- CreateIndex
CREATE INDEX "otps_UserID_CreatedAt_idx" ON "otps"("UserID", "CreatedAt" DESC);

-- CreateIndex
CREATE INDEX "reports_UserID_CreatedAt_idx" ON "reports"("UserID", "CreatedAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_UserID_CreatedAt_idx" ON "audit_logs"("UserID", "CreatedAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_Action_CreatedAt_idx" ON "audit_logs"("Action", "CreatedAt" DESC);

-- AddForeignKey
ALTER TABLE "aqms_sensor_details" ADD CONSTRAINT "aqms_sensor_details_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_parameter_masters" ADD CONSTRAINT "aqms_parameter_masters_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_measurement_units" ADD CONSTRAINT "aqms_measurement_units_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_site_parameters" ADD CONSTRAINT "aqms_site_parameters_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_site_parameters" ADD CONSTRAINT "aqms_site_parameters_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_site_parameters" ADD CONSTRAINT "aqms_site_parameters_FrequencyID_fkey" FOREIGN KEY ("FrequencyID") REFERENCES "aqms_sampling_frequencies"("SamplingFrequencyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_observations" ADD CONSTRAINT "aqms_ambient_air_quality_observations_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_observations" ADD CONSTRAINT "aqms_ambient_air_quality_observations_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_observations" ADD CONSTRAINT "aqms_ambient_air_quality_observations_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_observations" ADD CONSTRAINT "aqms_meteorological_observations_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_observations" ADD CONSTRAINT "aqms_meteorological_observations_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_observations" ADD CONSTRAINT "aqms_meteorological_observations_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_observations" ADD CONSTRAINT "aqms_cems_air_quality_observations_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_observations" ADD CONSTRAINT "aqms_cems_air_quality_observations_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_observations" ADD CONSTRAINT "aqms_cems_air_quality_observations_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_aq_parameters_thresholds" ADD CONSTRAINT "aqms_aq_parameters_thresholds_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_health_advisories" ADD CONSTRAINT "aqms_health_advisories_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_health_advisories" ADD CONSTRAINT "aqms_health_advisories_IndexID_fkey" FOREIGN KEY ("IndexID") REFERENCES "aqms_aq_index_masters"("IndexID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_hourly_stats" ADD CONSTRAINT "aqms_air_quality_index_hourly_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_hourly_stats" ADD CONSTRAINT "aqms_air_quality_index_hourly_stats_DominantPollutantID_fkey" FOREIGN KEY ("DominantPollutantID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_hourly_stats" ADD CONSTRAINT "aqms_air_quality_index_hourly_stats_IndexID_fkey" FOREIGN KEY ("IndexID") REFERENCES "aqms_aq_index_masters"("IndexID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_daily_stats" ADD CONSTRAINT "aqms_air_quality_index_daily_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_daily_stats" ADD CONSTRAINT "aqms_air_quality_index_daily_stats_DominantPollutantID_fkey" FOREIGN KEY ("DominantPollutantID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_daily_stats" ADD CONSTRAINT "aqms_air_quality_index_daily_stats_IndexID_fkey" FOREIGN KEY ("IndexID") REFERENCES "aqms_aq_index_masters"("IndexID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_monthly_stats" ADD CONSTRAINT "aqms_air_quality_index_monthly_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_monthly_stats" ADD CONSTRAINT "aqms_air_quality_index_monthly_stats_DominantPollutantID_fkey" FOREIGN KEY ("DominantPollutantID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_monthly_stats" ADD CONSTRAINT "aqms_air_quality_index_monthly_stats_IndexID_fkey" FOREIGN KEY ("IndexID") REFERENCES "aqms_aq_index_masters"("IndexID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_yearly_stats" ADD CONSTRAINT "aqms_air_quality_index_yearly_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_yearly_stats" ADD CONSTRAINT "aqms_air_quality_index_yearly_stats_DominantPollutantID_fkey" FOREIGN KEY ("DominantPollutantID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_air_quality_index_yearly_stats" ADD CONSTRAINT "aqms_air_quality_index_yearly_stats_IndexID_fkey" FOREIGN KEY ("IndexID") REFERENCES "aqms_aq_index_masters"("IndexID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_hourly_stats" ADD CONSTRAINT "aqms_ambient_air_quality_hourly_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_hourly_stats" ADD CONSTRAINT "aqms_ambient_air_quality_hourly_stats_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_hourly_stats" ADD CONSTRAINT "aqms_ambient_air_quality_hourly_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_daily_stats" ADD CONSTRAINT "aqms_ambient_air_quality_daily_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_daily_stats" ADD CONSTRAINT "aqms_ambient_air_quality_daily_stats_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_daily_stats" ADD CONSTRAINT "aqms_ambient_air_quality_daily_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_monthly_stats" ADD CONSTRAINT "aqms_ambient_air_quality_monthly_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_monthly_stats" ADD CONSTRAINT "aqms_ambient_air_quality_monthly_stats_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_ambient_air_quality_monthly_stats" ADD CONSTRAINT "aqms_ambient_air_quality_monthly_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_hourly_stats" ADD CONSTRAINT "aqms_meteorological_hourly_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_hourly_stats" ADD CONSTRAINT "aqms_meteorological_hourly_stats_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_hourly_stats" ADD CONSTRAINT "aqms_meteorological_hourly_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_daily_stats" ADD CONSTRAINT "aqms_meteorological_daily_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_daily_stats" ADD CONSTRAINT "aqms_meteorological_daily_stats_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_daily_stats" ADD CONSTRAINT "aqms_meteorological_daily_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_monthly_stats" ADD CONSTRAINT "aqms_meteorological_monthly_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_monthly_stats" ADD CONSTRAINT "aqms_meteorological_monthly_stats_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_meteorological_monthly_stats" ADD CONSTRAINT "aqms_meteorological_monthly_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_hourly_stats" ADD CONSTRAINT "aqms_cems_air_quality_hourly_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_hourly_stats" ADD CONSTRAINT "aqms_cems_air_quality_hourly_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_hourly_stats" ADD CONSTRAINT "aqms_cems_air_quality_hourly_stats_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_daily_stats" ADD CONSTRAINT "aqms_cems_air_quality_daily_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_daily_stats" ADD CONSTRAINT "aqms_cems_air_quality_daily_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_daily_stats" ADD CONSTRAINT "aqms_cems_air_quality_daily_stats_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_monthly_stats" ADD CONSTRAINT "aqms_cems_air_quality_monthly_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_monthly_stats" ADD CONSTRAINT "aqms_cems_air_quality_monthly_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_cems_air_quality_monthly_stats" ADD CONSTRAINT "aqms_cems_air_quality_monthly_stats_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_completeness_hourly_stats" ADD CONSTRAINT "aqms_data_completeness_hourly_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_completeness_hourly_stats" ADD CONSTRAINT "aqms_data_completeness_hourly_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_completeness_daily_stats" ADD CONSTRAINT "aqms_data_completeness_daily_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_completeness_daily_stats" ADD CONSTRAINT "aqms_data_completeness_daily_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_completeness_monthly_stats" ADD CONSTRAINT "aqms_data_completeness_monthly_stats_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_completeness_monthly_stats" ADD CONSTRAINT "aqms_data_completeness_monthly_stats_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_flagged_observations" ADD CONSTRAINT "aqms_flagged_observations_AmbientObservationID_fkey" FOREIGN KEY ("AmbientObservationID") REFERENCES "aqms_ambient_air_quality_observations"("AmbientObservationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_flagged_observations" ADD CONSTRAINT "aqms_flagged_observations_MetObservationID_fkey" FOREIGN KEY ("MetObservationID") REFERENCES "aqms_meteorological_observations"("MetObservationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_flagged_observations" ADD CONSTRAINT "aqms_flagged_observations_CEMSObservationID_fkey" FOREIGN KEY ("CEMSObservationID") REFERENCES "aqms_cems_air_quality_observations"("CEMSObservationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_flagged_observations" ADD CONSTRAINT "aqms_flagged_observations_FlagID_fkey" FOREIGN KEY ("FlagID") REFERENCES "aqms_data_quality_flag_definitions"("FlagID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_violation_logs" ADD CONSTRAINT "aqms_data_violation_logs_AmbientObservationID_fkey" FOREIGN KEY ("AmbientObservationID") REFERENCES "aqms_ambient_air_quality_observations"("AmbientObservationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_violation_logs" ADD CONSTRAINT "aqms_data_violation_logs_MetObservationID_fkey" FOREIGN KEY ("MetObservationID") REFERENCES "aqms_meteorological_observations"("MetObservationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_violation_logs" ADD CONSTRAINT "aqms_data_violation_logs_CEMSObservationID_fkey" FOREIGN KEY ("CEMSObservationID") REFERENCES "aqms_cems_air_quality_observations"("CEMSObservationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_violation_logs" ADD CONSTRAINT "aqms_data_violation_logs_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_violation_logs" ADD CONSTRAINT "aqms_data_violation_logs_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_data_violation_logs" ADD CONSTRAINT "aqms_data_violation_logs_ThresholdID_fkey" FOREIGN KEY ("ThresholdID") REFERENCES "aqms_aq_parameters_thresholds"("ThresholdID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_calibration_data" ADD CONSTRAINT "aqms_calibration_data_CalibrationSequenceID_fkey" FOREIGN KEY ("CalibrationSequenceID") REFERENCES "aqms_calibration_definitions"("CalibrationSequenceID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_wind_rose_logs" ADD CONSTRAINT "aqms_wind_rose_logs_StationID_fkey" FOREIGN KEY ("StationID") REFERENCES "aqms_monitoring_sites"("StationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_wind_rose_logs" ADD CONSTRAINT "aqms_wind_rose_logs_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_notification_logs" ADD CONSTRAINT "aqms_notification_logs_NotificationTypeID_fkey" FOREIGN KEY ("NotificationTypeID") REFERENCES "aqms_notification_masters"("NotificationTypeID") ON DELETE RESTRICT ON UPDATE CASCADE;


COMMIT;
