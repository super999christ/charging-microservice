const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1684795352509 {
    name = 'Updates1684795352509'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" DROP COLUMN "SmsNotificationId"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" ADD "SmsNotificationId" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" DROP COLUMN "EmailNotificationId"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" ADD "EmailNotificationId" bigint NOT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" DROP COLUMN "EmailNotificationId"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" ADD "EmailNotificationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" DROP COLUMN "SmsNotificationId"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" ADD "SmsNotificationId" uuid NOT NULL`);
    }
}
