const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1684859838045 {
    name = 'Updates1684859838045'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "tbl_Password_Resets​" ("PasswordResetId" uuid NOT NULL DEFAULT uuid_generate_v4(), "Email" character varying NOT NULL, "Verified" boolean NOT NULL DEFAULT false, "EmailNotificationId" bigint, "CreatedDate" TIMESTAMP NOT NULL DEFAULT now(), "UpdatedDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_92073426efdc013489d97097d10" PRIMARY KEY ("PasswordResetId"))`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "tbl_Password_Resets​"`);
    }
}
