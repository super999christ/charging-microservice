const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1688690842908 {
    name = 'Updates1688690842908'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "CreatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "UpdatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "UpdatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "UpdatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "UpdatedDate" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "CreatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "CreatedDate" TIMESTAMP NOT NULL DEFAULT now()`);
    }
}
