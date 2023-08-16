const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1690488954175 {
    name = 'Updates1690488954175'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Event_Test_Configs" RENAME COLUMN "TestMethod" TO "TestMode"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Charging_Event_Test_Configs" RENAME COLUMN "TestMode" TO "TestMethod"`);
    }
}
