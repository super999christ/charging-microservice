const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1688690842908 {
    name = 'Updates1688690842908'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Users" DROP COLUMN "CreatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" ADD "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" DROP COLUMN "UpdatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" ADD "UpdatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Phones" DROP COLUMN "CreatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Phones" ADD "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Phones" DROP COLUMN "UpdatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Phones" ADD "UpdatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_Password_Resets​" DROP COLUMN "CreatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Password_Resets​" ADD "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_Password_Resets​" DROP COLUMN "UpdatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Password_Resets​" ADD "UpdatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" DROP COLUMN "CreatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" ADD "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" DROP COLUMN "UpdatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" ADD "UpdatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" DROP COLUMN "UpdatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" ADD "UpdatedDate" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" DROP COLUMN "CreatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Registration" ADD "CreatedDate" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_Password_Resets​" DROP COLUMN "UpdatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Password_Resets​" ADD "UpdatedDate" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_Password_Resets​" DROP COLUMN "CreatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Password_Resets​" ADD "CreatedDate" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Phones" DROP COLUMN "UpdatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Phones" ADD "UpdatedDate" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Phones" DROP COLUMN "CreatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_User_Phones" ADD "CreatedDate" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" DROP COLUMN "UpdatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" ADD "UpdatedDate" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" DROP COLUMN "CreatedDate"`);
        await queryRunner.query(`ALTER TABLE "tbl_Users" ADD "CreatedDate" TIMESTAMP NOT NULL DEFAULT now()`);
    }
}
