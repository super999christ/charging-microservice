const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1683812392267 {
  name = "Updates1683812392267";

  async up(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "StripeCustomerId" character varying NOT NULL DEFAULT ''`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "CreatedDate" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "UpdatedDate" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" ADD "CreatedDate" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" ADD "UpdatedDate" TIMESTAMP NOT NULL DEFAULT now()`
    );
  }

  async down(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" DROP COLUMN "UpdatedDate"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" DROP COLUMN "CreatedDate"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP COLUMN "UpdatedDate"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP COLUMN "CreatedDate"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP COLUMN "StripeCustomerId"`
    );
  }
};
