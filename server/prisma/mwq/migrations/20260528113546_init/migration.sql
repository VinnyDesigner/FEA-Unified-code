-- CreateEnum
CREATE TYPE "Module" AS ENUM ('AQMS', 'MWQ');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('XLSX', 'DOCX', 'PDF');

-- CreateEnum
CREATE TYPE "AlarmSeverity" AS ENUM ('INFO', 'WARN', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlarmCode" AS ENUM ('COMM_LOST', 'DOOR_OPEN', 'GPS_LOST', 'BATTERY_LOW', 'SENSOR_FAULT', 'POWER_FAULT', 'THRESHOLD_EXCEEDED', 'OFFLINE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "mwq_buoys" (
    "BuoyID" SERIAL NOT NULL,
    "BuoyName" VARCHAR(120) NOT NULL,
    "Latitude" DECIMAL(9,6) NOT NULL,
    "Longitude" DECIMAL(9,6) NOT NULL,
    "Remarks" TEXT,

    CONSTRAINT "mwq_buoys_pkey" PRIMARY KEY ("BuoyID")
);

-- CreateTable
CREATE TABLE "mwq_sensor_catalog" (
    "SensorID" SERIAL NOT NULL,
    "SensorName" VARCHAR(120) NOT NULL,
    "SensorType" VARCHAR(60) NOT NULL,
    "Model" VARCHAR(120) NOT NULL,
    "Manufacturer" VARCHAR(120) NOT NULL,
    "Remarks" TEXT,

    CONSTRAINT "mwq_sensor_catalog_pkey" PRIMARY KEY ("SensorID")
);

-- CreateTable
CREATE TABLE "mwq_buoy_sensors" (
    "BuoySensorID" SERIAL NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,
    "DataFrequency" VARCHAR(40) NOT NULL,
    "Status" VARCHAR(20) NOT NULL,
    "Remarks" TEXT,

    CONSTRAINT "mwq_buoy_sensors_pkey" PRIMARY KEY ("BuoySensorID")
);

-- CreateTable
CREATE TABLE "mwq_parameter_units" (
    "UnitID" SERIAL NOT NULL,
    "UnitName" VARCHAR(60) NOT NULL,
    "Unit" VARCHAR(40) NOT NULL,

    CONSTRAINT "mwq_parameter_units_pkey" PRIMARY KEY ("UnitID")
);

-- CreateTable
CREATE TABLE "mwq_parameter_masters" (
    "ParameterID" SERIAL NOT NULL,
    "SensorType" VARCHAR(60) NOT NULL,
    "ParameterName" VARCHAR(120) NOT NULL,
    "UnitID" INTEGER NOT NULL,
    "Description" TEXT,

    CONSTRAINT "mwq_parameter_masters_pkey" PRIMARY KEY ("ParameterID")
);

-- CreateTable
CREATE TABLE "mwq_parameter_thresholds" (
    "ThresholdID" SERIAL NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "Remarks" TEXT,

    CONSTRAINT "mwq_parameter_thresholds_pkey" PRIMARY KEY ("ThresholdID")
);

-- CreateTable
CREATE TABLE "mwq_sonde_observations" (
    "ObservationID" BIGSERIAL NOT NULL,
    "BuoySensorID" INTEGER NOT NULL,
    "ObservationTime" TIMESTAMPTZ(6) NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "Value" DECIMAL(12,4) NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,

    CONSTRAINT "mwq_sonde_observations_pkey" PRIMARY KEY ("ObservationID")
);

-- CreateTable
CREATE TABLE "mwq_weather_observations" (
    "ObservationID" BIGSERIAL NOT NULL,
    "BuoySensorID" INTEGER NOT NULL,
    "ObservationTime" TIMESTAMPTZ(6) NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "Value" DECIMAL(12,4) NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,

    CONSTRAINT "mwq_weather_observations_pkey" PRIMARY KEY ("ObservationID")
);

-- CreateTable
CREATE TABLE "mwq_gps_observations" (
    "ObservationID" BIGSERIAL NOT NULL,
    "BuoySensorID" INTEGER NOT NULL,
    "ObservationTime" TIMESTAMPTZ(6) NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "Value" DECIMAL(12,4) NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,

    CONSTRAINT "mwq_gps_observations_pkey" PRIMARY KEY ("ObservationID")
);

-- CreateTable
CREATE TABLE "mwq_battery_observations" (
    "ObservationID" BIGSERIAL NOT NULL,
    "BuoySensorID" INTEGER NOT NULL,
    "ObservationTime" TIMESTAMPTZ(6) NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "Value" DECIMAL(12,4) NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,

    CONSTRAINT "mwq_battery_observations_pkey" PRIMARY KEY ("ObservationID")
);

-- CreateTable
CREATE TABLE "mwq_door_observations" (
    "ObservationID" BIGSERIAL NOT NULL,
    "BuoySensorID" INTEGER NOT NULL,
    "ObservationTime" TIMESTAMPTZ(6) NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "Value" DECIMAL(12,4) NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,

    CONSTRAINT "mwq_door_observations_pkey" PRIMARY KEY ("ObservationID")
);

-- CreateTable
CREATE TABLE "mwq_data_capture_rates" (
    "CaptureRateID" SERIAL NOT NULL,
    "BuoySensorID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "Date" DATE NOT NULL,
    "ExpectedRecords" INTEGER NOT NULL,
    "ReceivedRecords" INTEGER NOT NULL,
    "ValidRecords" INTEGER NOT NULL,
    "CaptureRatePercentage" DECIMAL(5,2) NOT NULL,
    "ValidCaptureRatePercentage" DECIMAL(5,2) NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,

    CONSTRAINT "mwq_data_capture_rates_pkey" PRIMARY KEY ("CaptureRateID")
);

-- CreateTable
CREATE TABLE "mwq_data_capture_rates_hourly" (
    "CaptureRateID" SERIAL NOT NULL,
    "BuoySensorID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "Date" TIMESTAMPTZ(6) NOT NULL,
    "ExpectedRecords" INTEGER NOT NULL,
    "ReceivedRecords" INTEGER NOT NULL,
    "ValidRecords" INTEGER NOT NULL,
    "CaptureRatePercentage" DECIMAL(5,2) NOT NULL,
    "ValidCaptureRatePercentage" DECIMAL(5,2) NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,

    CONSTRAINT "mwq_data_capture_rates_hourly_pkey" PRIMARY KEY ("CaptureRateID")
);

-- CreateTable
CREATE TABLE "mwq_data_capture_rates_monthly" (
    "CaptureRateID" SERIAL NOT NULL,
    "BuoySensorID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "Date" DATE NOT NULL,
    "ExpectedRecords" INTEGER NOT NULL,
    "ReceivedRecords" INTEGER NOT NULL,
    "ValidRecords" INTEGER NOT NULL,
    "CaptureRatePercentage" DECIMAL(5,2) NOT NULL,
    "ValidCaptureRatePercentage" DECIMAL(5,2) NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,

    CONSTRAINT "mwq_data_capture_rates_monthly_pkey" PRIMARY KEY ("CaptureRateID")
);

-- CreateTable
CREATE TABLE "mwq_hourly_summaries" (
    "HourlySummaryID" BIGSERIAL NOT NULL,
    "BuoySensorID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,

    CONSTRAINT "mwq_hourly_summaries_pkey" PRIMARY KEY ("HourlySummaryID")
);

-- CreateTable
CREATE TABLE "mwq_daily_summaries" (
    "DailySummaryID" BIGSERIAL NOT NULL,
    "BuoySensorID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,

    CONSTRAINT "mwq_daily_summaries_pkey" PRIMARY KEY ("DailySummaryID")
);

-- CreateTable
CREATE TABLE "mwq_monthly_summaries" (
    "MonthlySummaryID" BIGSERIAL NOT NULL,
    "BuoySensorID" INTEGER NOT NULL,
    "ParameterID" INTEGER NOT NULL,
    "DateTime" TIMESTAMPTZ(6) NOT NULL,
    "AvgValue" DECIMAL(12,4) NOT NULL,
    "MinValue" DECIMAL(12,4) NOT NULL,
    "MaxValue" DECIMAL(12,4) NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,

    CONSTRAINT "mwq_monthly_summaries_pkey" PRIMARY KEY ("MonthlySummaryID")
);

-- CreateTable
CREATE TABLE "mwq_alert_masters" (
    "AlertMasterID" SERIAL NOT NULL,
    "AlertCode" VARCHAR(40) NOT NULL,
    "AlertType" VARCHAR(60) NOT NULL,
    "AlertMessage" TEXT NOT NULL,
    "AlertLevel" VARCHAR(20) NOT NULL,
    "AlertTime" TIMESTAMPTZ(6),
    "AlertCategory" VARCHAR(60) NOT NULL,
    "ThresholdID" INTEGER,
    "ParameterID" INTEGER,

    CONSTRAINT "mwq_alert_masters_pkey" PRIMARY KEY ("AlertMasterID")
);

-- CreateTable
CREATE TABLE "mwq_station_alerts" (
    "AlertID" BIGSERIAL NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SensorID" INTEGER NOT NULL,
    "AlertMasterID" INTEGER NOT NULL,
    "AlertTime" TIMESTAMPTZ(6) NOT NULL,
    "AlertStatus" VARCHAR(20) NOT NULL,
    "ResolvedTime" TIMESTAMPTZ(6),
    "AlertValue" DECIMAL(12,4),
    "Remarks" TEXT,

    CONSTRAINT "mwq_station_alerts_pkey" PRIMARY KEY ("AlertID")
);

-- CreateTable
CREATE TABLE "mwq_station_media" (
    "MediaID" SERIAL NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "MediaType" VARCHAR(40) NOT NULL,
    "FileName" VARCHAR(255) NOT NULL,
    "FilePath" VARCHAR(512) NOT NULL,
    "Remarks" TEXT,

    CONSTRAINT "mwq_station_media_pkey" PRIMARY KEY ("MediaID")
);

-- CreateTable
CREATE TABLE "mwq_wind_rose_summaries" (
    "WindRoseID" SERIAL NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "ObservationTime" TIMESTAMPTZ(6) NOT NULL,
    "DirectionSector" VARCHAR(8) NOT NULL,
    "WindSpeedClass" VARCHAR(40) NOT NULL,
    "FrequencyPercent" DECIMAL(5,2) NOT NULL,
    "Remarks" TEXT,

    CONSTRAINT "mwq_wind_rose_summaries_pkey" PRIMARY KEY ("WindRoseID")
);

-- CreateTable
CREATE TABLE "mwq_logger_system_infos" (
    "LoggerID" SERIAL NOT NULL,
    "BuoyID" INTEGER NOT NULL,
    "SerialNumber" VARCHAR(60) NOT NULL,
    "RevBoard" VARCHAR(40) NOT NULL,
    "OSVersion" VARCHAR(40) NOT NULL,
    "OSDate" DATE NOT NULL,
    "OSSignature" VARCHAR(64) NOT NULL,
    "ProgramName" VARCHAR(120) NOT NULL,
    "ProgramSignature" VARCHAR(64) NOT NULL,
    "RunSignature" VARCHAR(64) NOT NULL,
    "StartTime" TIMESTAMPTZ(6) NOT NULL,
    "CompileResults" TEXT NOT NULL,

    CONSTRAINT "mwq_logger_system_infos_pkey" PRIMARY KEY ("LoggerID")
);

-- CreateTable
CREATE TABLE "mwq_logger_runtime_statuses" (
    "StatusID" BIGSERIAL NOT NULL,
    "LoggerID" INTEGER NOT NULL,
    "Timestamp" TIMESTAMPTZ(6) NOT NULL,
    "WatchdogErrors" INTEGER NOT NULL,
    "ProgErrors" INTEGER NOT NULL,
    "VarOutOfBound" INTEGER NOT NULL,
    "SkippedScan" INTEGER NOT NULL,
    "ProgramName" VARCHAR(120) NOT NULL,
    "SkippedSlowScan" INTEGER NOT NULL,
    "SerialFlashErrors" INTEGER NOT NULL,
    "WiFiUpdateRequired" BOOLEAN NOT NULL,
    "SW12Volts" DECIMAL(5,2) NOT NULL,
    "CommsMemFree" INTEGER NOT NULL,

    CONSTRAINT "mwq_logger_runtime_statuses_pkey" PRIMARY KEY ("StatusID")
);

-- CreateTable
CREATE TABLE "mwq_logger_port_statuses" (
    "PortStatusID" BIGSERIAL NOT NULL,
    "StatusID" BIGINT NOT NULL,
    "PortNumber" INTEGER NOT NULL,
    "PortStatus" VARCHAR(20) NOT NULL,
    "PortConfig" TEXT NOT NULL,

    CONSTRAINT "mwq_logger_port_statuses_pkey" PRIMARY KEY ("PortStatusID")
);

-- CreateTable
CREATE TABLE "mwq_logger_calibration_infos" (
    "CalibrationID" SERIAL NOT NULL,
    "LoggerID" INTEGER NOT NULL,
    "CalGainFast2500" DECIMAL(12,6) NOT NULL,
    "CalGainSlow34" DECIMAL(12,6) NOT NULL,
    "CalGainMed34" DECIMAL(12,6) NOT NULL,
    "CalGainFast34" DECIMAL(12,6) NOT NULL,
    "CalOffset" DECIMAL(12,6) NOT NULL,

    CONSTRAINT "mwq_logger_calibration_infos_pkey" PRIMARY KEY ("CalibrationID")
);

-- CreateTable
CREATE TABLE "mwq_station_health_metadata" (
    "HealthID" BIGSERIAL NOT NULL,
    "LoggerID" INTEGER NOT NULL,
    "Timestamp" TIMESTAMPTZ(6) NOT NULL,
    "Battery" DECIMAL(5,2) NOT NULL,
    "PanelTemp" DECIMAL(5,2) NOT NULL,
    "MemoryFree" INTEGER NOT NULL,
    "CPUDriveFree" INTEGER NOT NULL,
    "DataStorageSize" INTEGER NOT NULL,
    "DataStorageFree" INTEGER NOT NULL,
    "ProcessTime" INTEGER NOT NULL,
    "MaxProcessTime" INTEGER NOT NULL,
    "MeasureTime" INTEGER NOT NULL,
    "FullMemReset" BOOLEAN NOT NULL,

    CONSTRAINT "mwq_station_health_metadata_pkey" PRIMARY KEY ("HealthID")
);

-- CreateTable
CREATE TABLE "users" (
    "UserID" SERIAL NOT NULL,
    "UserName" VARCHAR(60) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "Password" VARCHAR(255) NOT NULL,
    "FirstName" VARCHAR(80) NOT NULL,
    "MiddleName" VARCHAR(80),
    "LastName" VARCHAR(80) NOT NULL,
    "PhoneNumber" VARCHAR(40),
    "EmiratesId" VARCHAR(40),
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("UserID")
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
CREATE INDEX "mwq_sonde_observations_BuoyID_ParameterID_ObservationTime_idx" ON "mwq_sonde_observations"("BuoyID", "ParameterID", "ObservationTime" DESC);

-- CreateIndex
CREATE INDEX "mwq_weather_observations_BuoyID_ParameterID_ObservationTime_idx" ON "mwq_weather_observations"("BuoyID", "ParameterID", "ObservationTime" DESC);

-- CreateIndex
CREATE INDEX "mwq_gps_observations_BuoyID_ParameterID_ObservationTime_idx" ON "mwq_gps_observations"("BuoyID", "ParameterID", "ObservationTime" DESC);

-- CreateIndex
CREATE INDEX "mwq_battery_observations_BuoyID_ParameterID_ObservationTime_idx" ON "mwq_battery_observations"("BuoyID", "ParameterID", "ObservationTime" DESC);

-- CreateIndex
CREATE INDEX "mwq_door_observations_BuoyID_ParameterID_ObservationTime_idx" ON "mwq_door_observations"("BuoyID", "ParameterID", "ObservationTime" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "mwq_data_capture_rates_BuoyID_SensorID_ParameterID_Date_key" ON "mwq_data_capture_rates"("BuoyID", "SensorID", "ParameterID", "Date");

-- CreateIndex
CREATE INDEX "mwq_hourly_summaries_BuoyID_ParameterID_DateTime_idx" ON "mwq_hourly_summaries"("BuoyID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "mwq_daily_summaries_BuoyID_ParameterID_DateTime_idx" ON "mwq_daily_summaries"("BuoyID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE INDEX "mwq_monthly_summaries_BuoyID_ParameterID_DateTime_idx" ON "mwq_monthly_summaries"("BuoyID", "ParameterID", "DateTime" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "mwq_alert_masters_AlertCode_key" ON "mwq_alert_masters"("AlertCode");

-- CreateIndex
CREATE INDEX "mwq_station_alerts_BuoyID_AlertTime_idx" ON "mwq_station_alerts"("BuoyID", "AlertTime" DESC);

-- CreateIndex
CREATE INDEX "mwq_logger_runtime_statuses_LoggerID_Timestamp_idx" ON "mwq_logger_runtime_statuses"("LoggerID", "Timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "users_UserName_key" ON "users"("UserName");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "otps_UserID_CreatedAt_idx" ON "otps"("UserID", "CreatedAt" DESC);

-- CreateIndex
CREATE INDEX "reports_UserID_CreatedAt_idx" ON "reports"("UserID", "CreatedAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_UserID_CreatedAt_idx" ON "audit_logs"("UserID", "CreatedAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_Action_CreatedAt_idx" ON "audit_logs"("Action", "CreatedAt" DESC);

-- AddForeignKey
ALTER TABLE "mwq_buoy_sensors" ADD CONSTRAINT "mwq_buoy_sensors_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_buoy_sensors" ADD CONSTRAINT "mwq_buoy_sensors_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_parameter_masters" ADD CONSTRAINT "mwq_parameter_masters_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "mwq_parameter_units"("UnitID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_parameter_thresholds" ADD CONSTRAINT "mwq_parameter_thresholds_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_sonde_observations" ADD CONSTRAINT "mwq_sonde_observations_BuoySensorID_fkey" FOREIGN KEY ("BuoySensorID") REFERENCES "mwq_buoy_sensors"("BuoySensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_sonde_observations" ADD CONSTRAINT "mwq_sonde_observations_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_sonde_observations" ADD CONSTRAINT "mwq_sonde_observations_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_sonde_observations" ADD CONSTRAINT "mwq_sonde_observations_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_weather_observations" ADD CONSTRAINT "mwq_weather_observations_BuoySensorID_fkey" FOREIGN KEY ("BuoySensorID") REFERENCES "mwq_buoy_sensors"("BuoySensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_weather_observations" ADD CONSTRAINT "mwq_weather_observations_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_weather_observations" ADD CONSTRAINT "mwq_weather_observations_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_weather_observations" ADD CONSTRAINT "mwq_weather_observations_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_gps_observations" ADD CONSTRAINT "mwq_gps_observations_BuoySensorID_fkey" FOREIGN KEY ("BuoySensorID") REFERENCES "mwq_buoy_sensors"("BuoySensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_gps_observations" ADD CONSTRAINT "mwq_gps_observations_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_gps_observations" ADD CONSTRAINT "mwq_gps_observations_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_gps_observations" ADD CONSTRAINT "mwq_gps_observations_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_battery_observations" ADD CONSTRAINT "mwq_battery_observations_BuoySensorID_fkey" FOREIGN KEY ("BuoySensorID") REFERENCES "mwq_buoy_sensors"("BuoySensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_battery_observations" ADD CONSTRAINT "mwq_battery_observations_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_battery_observations" ADD CONSTRAINT "mwq_battery_observations_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_battery_observations" ADD CONSTRAINT "mwq_battery_observations_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_door_observations" ADD CONSTRAINT "mwq_door_observations_BuoySensorID_fkey" FOREIGN KEY ("BuoySensorID") REFERENCES "mwq_buoy_sensors"("BuoySensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_door_observations" ADD CONSTRAINT "mwq_door_observations_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_door_observations" ADD CONSTRAINT "mwq_door_observations_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_door_observations" ADD CONSTRAINT "mwq_door_observations_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates" ADD CONSTRAINT "mwq_data_capture_rates_BuoySensorID_fkey" FOREIGN KEY ("BuoySensorID") REFERENCES "mwq_buoy_sensors"("BuoySensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates" ADD CONSTRAINT "mwq_data_capture_rates_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates" ADD CONSTRAINT "mwq_data_capture_rates_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates" ADD CONSTRAINT "mwq_data_capture_rates_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates_hourly" ADD CONSTRAINT "mwq_data_capture_rates_hourly_BuoySensorID_fkey" FOREIGN KEY ("BuoySensorID") REFERENCES "mwq_buoy_sensors"("BuoySensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates_hourly" ADD CONSTRAINT "mwq_data_capture_rates_hourly_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates_hourly" ADD CONSTRAINT "mwq_data_capture_rates_hourly_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates_hourly" ADD CONSTRAINT "mwq_data_capture_rates_hourly_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates_monthly" ADD CONSTRAINT "mwq_data_capture_rates_monthly_BuoySensorID_fkey" FOREIGN KEY ("BuoySensorID") REFERENCES "mwq_buoy_sensors"("BuoySensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates_monthly" ADD CONSTRAINT "mwq_data_capture_rates_monthly_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates_monthly" ADD CONSTRAINT "mwq_data_capture_rates_monthly_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_data_capture_rates_monthly" ADD CONSTRAINT "mwq_data_capture_rates_monthly_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_hourly_summaries" ADD CONSTRAINT "mwq_hourly_summaries_BuoySensorID_fkey" FOREIGN KEY ("BuoySensorID") REFERENCES "mwq_buoy_sensors"("BuoySensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_hourly_summaries" ADD CONSTRAINT "mwq_hourly_summaries_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_hourly_summaries" ADD CONSTRAINT "mwq_hourly_summaries_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_hourly_summaries" ADD CONSTRAINT "mwq_hourly_summaries_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_daily_summaries" ADD CONSTRAINT "mwq_daily_summaries_BuoySensorID_fkey" FOREIGN KEY ("BuoySensorID") REFERENCES "mwq_buoy_sensors"("BuoySensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_daily_summaries" ADD CONSTRAINT "mwq_daily_summaries_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_daily_summaries" ADD CONSTRAINT "mwq_daily_summaries_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_daily_summaries" ADD CONSTRAINT "mwq_daily_summaries_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_monthly_summaries" ADD CONSTRAINT "mwq_monthly_summaries_BuoySensorID_fkey" FOREIGN KEY ("BuoySensorID") REFERENCES "mwq_buoy_sensors"("BuoySensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_monthly_summaries" ADD CONSTRAINT "mwq_monthly_summaries_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_monthly_summaries" ADD CONSTRAINT "mwq_monthly_summaries_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_monthly_summaries" ADD CONSTRAINT "mwq_monthly_summaries_SensorID_fkey" FOREIGN KEY ("SensorID") REFERENCES "mwq_sensor_catalog"("SensorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_alert_masters" ADD CONSTRAINT "mwq_alert_masters_ThresholdID_fkey" FOREIGN KEY ("ThresholdID") REFERENCES "mwq_parameter_thresholds"("ThresholdID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_alert_masters" ADD CONSTRAINT "mwq_alert_masters_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "mwq_parameter_masters"("ParameterID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_station_alerts" ADD CONSTRAINT "mwq_station_alerts_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_station_alerts" ADD CONSTRAINT "mwq_station_alerts_AlertMasterID_fkey" FOREIGN KEY ("AlertMasterID") REFERENCES "mwq_alert_masters"("AlertMasterID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_station_media" ADD CONSTRAINT "mwq_station_media_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_wind_rose_summaries" ADD CONSTRAINT "mwq_wind_rose_summaries_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_logger_system_infos" ADD CONSTRAINT "mwq_logger_system_infos_BuoyID_fkey" FOREIGN KEY ("BuoyID") REFERENCES "mwq_buoys"("BuoyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_logger_runtime_statuses" ADD CONSTRAINT "mwq_logger_runtime_statuses_LoggerID_fkey" FOREIGN KEY ("LoggerID") REFERENCES "mwq_logger_system_infos"("LoggerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_logger_port_statuses" ADD CONSTRAINT "mwq_logger_port_statuses_StatusID_fkey" FOREIGN KEY ("StatusID") REFERENCES "mwq_logger_runtime_statuses"("StatusID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_logger_calibration_infos" ADD CONSTRAINT "mwq_logger_calibration_infos_LoggerID_fkey" FOREIGN KEY ("LoggerID") REFERENCES "mwq_logger_system_infos"("LoggerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwq_station_health_metadata" ADD CONSTRAINT "mwq_station_health_metadata_LoggerID_fkey" FOREIGN KEY ("LoggerID") REFERENCES "mwq_logger_system_infos"("LoggerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;
