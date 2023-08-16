const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1690842909935 {
    name = 'Updates1690842909935'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Users" ADD "TCFlag" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tbl_Users" DROP COLUMN "TCFlag"`);
    }
}
