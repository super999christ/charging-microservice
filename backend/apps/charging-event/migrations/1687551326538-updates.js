const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1687551326538 {
    name = 'Updates1687551326538'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "ChargeStatusPercentage" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "ChargeDeliveredKWH" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "ChargeSpeedKW" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "ChargeVehicleRequestedKW" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "TotalCostDollars" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "TotalChargeTime" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ALTER COLUMN "NotificationId" DROP NOT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ALTER COLUMN "NotificationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "TotalChargeTime"`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "TotalCostDollars"`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "ChargeVehicleRequestedKW"`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "ChargeSpeedKW"`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "ChargeDeliveredKWH"`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "ChargeStatusPercentage"`);
    }
}
