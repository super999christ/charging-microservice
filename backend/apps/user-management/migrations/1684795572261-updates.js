const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1684795572261 {
    name = 'Updates1684795572261'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" ALTER COLUMN "EmailNotificationId" DROP NOT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" ALTER COLUMN "EmailNotificationId" SET NOT NULL`);
    }
}
