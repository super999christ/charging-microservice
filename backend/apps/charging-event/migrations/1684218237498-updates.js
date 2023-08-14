const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1684218237498 {
    name = 'Updates1684218237498'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" ADD "NotificationId" integer NOT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Events" DROP COLUMN "NotificationId"`);
    }
}
