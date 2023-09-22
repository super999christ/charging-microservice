const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1694663996376 {
    name = 'Updates1694663996376'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Users" DROP COLUMN "StripeCustomerId"`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" DROP COLUMN "StripePaymentMethodId"`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" ADD "PhoneNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" ADD "ChargingNotify" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Users" DROP COLUMN "ChargingNotify"`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" DROP COLUMN "PhoneNumber"`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" ADD "StripePaymentMethodId" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" ADD "StripeCustomerId" character varying NOT NULL DEFAULT ''`);
    }
}
