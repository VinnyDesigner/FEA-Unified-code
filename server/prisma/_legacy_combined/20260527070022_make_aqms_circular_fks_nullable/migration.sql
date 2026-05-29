-- DropForeignKey
ALTER TABLE "aqms_measurement_units" DROP CONSTRAINT "aqms_measurement_units_ParameterID_fkey";

-- DropForeignKey
ALTER TABLE "aqms_parameter_masters" DROP CONSTRAINT "aqms_parameter_masters_UnitID_fkey";

-- AlterTable
ALTER TABLE "aqms_measurement_units" ALTER COLUMN "ParameterID" DROP NOT NULL;

-- AlterTable
ALTER TABLE "aqms_parameter_masters" ALTER COLUMN "UnitID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "aqms_parameter_masters" ADD CONSTRAINT "aqms_parameter_masters_UnitID_fkey" FOREIGN KEY ("UnitID") REFERENCES "aqms_measurement_units"("UnitID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aqms_measurement_units" ADD CONSTRAINT "aqms_measurement_units_ParameterID_fkey" FOREIGN KEY ("ParameterID") REFERENCES "aqms_parameter_masters"("ParameterID") ON DELETE SET NULL ON UPDATE CASCADE;
