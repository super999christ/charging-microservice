const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1684792505860 {
    name = 'Updates1684792505860'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "tbl_User_Registration" ("RegistrationId" uuid NOT NULL DEFAULT uuid_generate_v4(), "Email" character varying NOT NULL, "FirstName" character varying NOT NULL, "LastName" character varying NOT NULL, "PhoneNumber" character varying NOT NULL, "Verified" boolean NOT NULL DEFAULT false, "SmsNotificationId" uuid NOT NULL, "EmailNotificationId" uuid NOT NULL, "CreatedDate" TIMESTAMP NOT NULL DEFAULT now(), "UpdatedDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_101da56f0e6dc8a7e600c8f4b2d" PRIMARY KEY ("RegistrationId"))`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "tbl_User_Registration"`);
    }
}
