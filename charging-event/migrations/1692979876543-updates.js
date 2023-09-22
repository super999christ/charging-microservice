const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1692979876543 {
    name = 'Updates1692979876543'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "ExceptionStatus" character varying`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "PaymentIntentId" character varying`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "ExceptionStatus"`);
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "PaymentIntentId"`);
    }
}
