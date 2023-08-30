const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1692979721903 {
    name = 'Updates1692979721903'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "SessionStatus" character varying`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "SessionStatus"`);
    }
}
