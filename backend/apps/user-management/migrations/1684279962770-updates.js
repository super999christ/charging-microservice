const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1684279962770 {
  name = "Updates1684279962770";

  async up(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "CreditCardNumber" character varying NOT NULL DEFAULT ''`
    );
  }

  async down(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP COLUMN "CreditCardNumber"`
    );
  }
};
