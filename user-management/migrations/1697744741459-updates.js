const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Updates1697744741459 {
  name = "Updates1697744741459";

  async up(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "StripeCustomerId" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "tbl_Users" ADD "StripePaymentMethodId" character varying`
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "tbl_Password_Resets​" ("PasswordResetId" uuid NOT NULL DEFAULT uuid_generate_v4(), "Email" character varying NOT NULL, "Verified" boolean NOT NULL DEFAULT false, "EmailNotificationId" bigint, "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_92073426efdc013489d97097d10" PRIMARY KEY ("PasswordResetId"))`
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "tbl_User_Registration" ("RegistrationId" uuid NOT NULL DEFAULT uuid_generate_v4(), "Email" character varying NOT NULL, "FirstName" character varying NOT NULL, "LastName" character varying NOT NULL, "PhoneNumber" character varying NOT NULL, "Verified" boolean NOT NULL DEFAULT false, "SmsNotificationId" bigint NOT NULL, "EmailNotificationId" bigint, "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_101da56f0e6dc8a7e600c8f4b2d" PRIMARY KEY ("RegistrationId"))`
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "tbl_Users" ("UserId" uuid NOT NULL DEFAULT uuid_generate_v4(), "Email" character varying NOT NULL, "PhoneNumber" character varying, "Password" character varying NOT NULL, "FirstName" character varying NOT NULL, "LastName" character varying NOT NULL, "Verified" boolean NOT NULL DEFAULT false, "Active" boolean NOT NULL DEFAULT true, "TCFlag" boolean NOT NULL DEFAULT false, "ChargingNotify" boolean NOT NULL DEFAULT false, "StripeCustomerId" character varying, "StripePaymentMethodId" character varying, "BillingPlanId" smallint DEFAULT '1', "VehicleCount" bigint DEFAULT '1', "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_b2d8baa4fbc171ee56f35de1dd" UNIQUE ("BillingPlanId"), CONSTRAINT "PK_27391a3f0bc498f25e7b4d4e122" PRIMARY KEY ("UserId"))`
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "tbl_User_Phones" ("PhoneId" BIGSERIAL NOT NULL, "PhoneNumber" character varying NOT NULL, "Active" boolean NOT NULL DEFAULT false, "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UserId" uuid, CONSTRAINT "PK_7ae55774802654f49e5ff6db088" PRIMARY KEY ("PhoneId"))`
    );

    await queryRunner.query(
      `INSERT INTO public."tbl_Billing_Plans"("BillingPlanId", "BillingPlan", "Active", "CreatedDate", "UpdatedDate") VALUES (1, 'Transaction', true, '10/02/2023', '10/02/2023')`
    );

    await queryRunner.query(
      `INSERT INTO public."tbl_Billing_Plans"("BillingPlanId", "BillingPlan", "Active", "CreatedDate", "UpdatedDate") VALUES (2, 'Subscription', true, '10/02/2023', '10/02/2023');`
    );
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE "tbl_User_Phones"`);
    await queryRunner.query(`DROP TABLE "tbl_Users"`);
    await queryRunner.query(`DROP TABLE "tbl_User_Registration"`);
    await queryRunner.query(`DROP TABLE "tbl_Password_Resets​"`);
    await queryRunner.query(`DROP TABLE "tbl_Billing_Plans"`);
    await queryRunner.query(`DROP TABLE "tbl_Subscription_Charges"`);
  }
};
