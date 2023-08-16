const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1683812490118 {
    name = 'Updates1683812490118'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "tbl_Charging_Events" ("ChargingEventId" BIGSERIAL NOT NULL, "PhoneNumber" character varying NOT NULL, "StationId" integer NOT NULL, "StationOnline" boolean NOT NULL DEFAULT false, "StationError" character varying, "CCAuth" boolean NOT NULL DEFAULT false, "CCCharge" boolean NOT NULL DEFAULT false, "CCAmount" double precision NOT NULL DEFAULT '0', "SMSAuthValid" boolean NOT NULL DEFAULT false, "CreatedDate" TIMESTAMP NOT NULL DEFAULT now(), "UpdatedDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_29fe6f61802f5037061823b7187" PRIMARY KEY ("ChargingEventId"))`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "tbl_Charging_Events"`);
    }
}
