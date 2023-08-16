const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1683600497543 {
  name = "Updates1683600497543";

  async up(queryRunner) {
    await queryRunner.query(
      `CREATE TABLE "tbl_Users" ("UserId" BIGSERIAL NOT NULL, "Email" character varying NOT NULL, "Password" character varying NOT NULL, "FirstName" character varying NOT NULL, "LastName" character varying NOT NULL, "Verified" boolean NOT NULL DEFAULT false, "Active" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_27391a3f0bc498f25e7b4d4e122" PRIMARY KEY ("UserId"))`
    );
    await queryRunner.query(
      `CREATE TABLE "tbl_User_Phones" ("PhoneId" BIGSERIAL NOT NULL, "PhoneNumber" character varying NOT NULL, "Active" boolean NOT NULL DEFAULT false, "UserId" bigint, CONSTRAINT "PK_7ae55774802654f49e5ff6db088" PRIMARY KEY ("PhoneId"))`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" ADD CONSTRAINT "FK_63ced06e764b5566f5da7587234" FOREIGN KEY ("UserId") REFERENCES "tbl_Users"("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  async down(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "tbl_User_Phones" DROP CONSTRAINT "FK_63ced06e764b5566f5da7587234"`
    );
    await queryRunner.query(`DROP TABLE "tbl_User_Phones"`);
    await queryRunner.query(`DROP TABLE "tbl_Users"`);
  }
};
