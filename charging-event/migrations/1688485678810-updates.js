const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1688485678810 {
    name = 'Updates1688485678810'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "RateActiveKWH" double precision NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "RateActiveKWH"`);
    }
}
