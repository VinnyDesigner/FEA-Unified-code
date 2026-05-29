-- Add nullable ReportType column to reports (additive, non-destructive)
ALTER TABLE "reports" ADD COLUMN "ReportType" VARCHAR(40);
