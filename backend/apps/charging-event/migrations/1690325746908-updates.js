const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1690325746908 {
    name = 'Updates1690325746908'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "tbl_Charging_Event_Test_Configs" ("Id" SERIAL NOT NULL, "TestMethod" boolean NOT NULL, "IOTMethod" character varying NOT NULL, "TestData" character varying NOT NULL, CONSTRAINT "PK_5a907149d29ac42bfee3eee44e9" PRIMARY KEY ("Id"))`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "tbl_Charging_Event_Test_Configs"`);
    }
}
