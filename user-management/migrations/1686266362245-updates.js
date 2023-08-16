const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1686266362245 {
    name = 'Updates1686266362245'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Users" RENAME COLUMN "CreditCardNumber" TO "StripePaymentMethodId"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Users" RENAME COLUMN "StripePaymentMethodId" TO "CreditCardNumber"`);
    }
}
