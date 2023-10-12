const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1697125152613 {
  name = "Updates1697125152613";

  async up(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP CONSTRAINT "fk_billing_plan_users"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" DROP CONSTRAINT "fk_subscription_users"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Billing_Plans" DROP CONSTRAINT "PK_Billing_Plans"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Billing_Plans" DROP COLUMN "BillingPlanId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Billing_Plans" ADD "BillingPlanId" SERIAL NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Billing_Plans" ADD CONSTRAINT "PK_d87a5464300f69c20c05e8197e1" PRIMARY KEY ("BillingPlanId")`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP COLUMN "BillingPlanId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "BillingPlanId" integer DEFAULT '1'`
    );
    // await queryRunner.query(`ALTER TABLE "tbl_Users" ADD CONSTRAINT "UQ_b2d8baa4fbc171ee56f35de1dd6" UNIQUE ("BillingPlanId")`);
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP COLUMN "VehicleCount"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "VehicleCount" bigint DEFAULT '1'`
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "tbl_Subscription_Charges_SubscriptionChargeId_seq" OWNED BY "tbl_Subscription_Charges"."SubscriptionChargeId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" ALTER COLUMN "SubscriptionChargeId" SET DEFAULT nextval('"tbl_Subscription_Charges_SubscriptionChargeId_seq"')`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" ALTER COLUMN "Amount" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" ALTER COLUMN "Description" SET DEFAULT true`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" ALTER COLUMN "ChargeStatus" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" ALTER COLUMN "ChargeStatus" SET DEFAULT true`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD CONSTRAINT "FK_b2d8baa4fbc171ee56f35de1dd6" FOREIGN KEY ("BillingPlanId") REFERENCES "tbl_Billing_Plans"("BillingPlanId") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  async down(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP CONSTRAINT "FK_b2d8baa4fbc171ee56f35de1dd6"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" ALTER COLUMN "ChargeStatus" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" ALTER COLUMN "ChargeStatus" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" ALTER COLUMN "Description" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" ALTER COLUMN "Amount" SET DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" ALTER COLUMN "SubscriptionChargeId" DROP DEFAULT`
    );
    await queryRunner.query(
      `DROP SEQUENCE "tbl_Subscription_Charges_SubscriptionChargeId_seq"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP COLUMN "VehicleCount"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "VehicleCount" smallint NOT NULL DEFAULT '1'`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP CONSTRAINT "UQ_b2d8baa4fbc171ee56f35de1dd6"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" DROP COLUMN "BillingPlanId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "BillingPlanId" smallint NOT NULL DEFAULT '1'`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Billing_Plans" DROP CONSTRAINT "PK_d87a5464300f69c20c05e8197e1"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Billing_Plans" DROP COLUMN "BillingPlanId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Billing_Plans" ADD "BillingPlanId" smallint NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Billing_Plans" ADD CONSTRAINT "PK_Billing_Plans" PRIMARY KEY ("BillingPlanId")`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Subscription_Charges" ADD CONSTRAINT "fk_subscription_users" FOREIGN KEY ("UserId") REFERENCES "tbl_Users"("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD CONSTRAINT "fk_billing_plan_users" FOREIGN KEY ("BillingPlanId") REFERENCES "tbl_Billing_Plans"("BillingPlanId") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
};
