const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1683844196961 {
  name = "Updates1683844196961";

  async up(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" DROP CONSTRAINT "FK_63ced06e764b5566f5da7587234"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP CONSTRAINT "PK_27391a3f0bc498f25e7b4d4e122"`
    );
    await queryRunner.query(`ALTER TABLE "tbl_Users" DROP COLUMN "UserId"`);
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "UserId" uuid NOT NULL DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD CONSTRAINT "PK_27391a3f0bc498f25e7b4d4e122" PRIMARY KEY ("UserId")`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" DROP COLUMN "UserId"`
    );
    await queryRunner.query(`ALTER TABLE "tbl_User_Phones" ADD "UserId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" ADD CONSTRAINT "FK_63ced06e764b5566f5da7587234" FOREIGN KEY ("UserId") REFERENCES "tbl_Users"("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  async down(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" DROP CONSTRAINT "FK_63ced06e764b5566f5da7587234"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" DROP COLUMN "UserId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" ADD "UserId" bigint`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP CONSTRAINT "PK_27391a3f0bc498f25e7b4d4e122"`
    );
    await queryRunner.query(`ALTER TABLE "tbl_Users" DROP COLUMN "UserId"`);
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "UserId" BIGSERIAL NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD CONSTRAINT "PK_27391a3f0bc498f25e7b4d4e122" PRIMARY KEY ("UserId")`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" ADD CONSTRAINT "FK_63ced06e764b5566f5da7587234" FOREIGN KEY ("UserId") REFERENCES "tbl_Users"("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
};
