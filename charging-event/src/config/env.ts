import * as dotenv from "dotenv";

dotenv.config();
if (process.env.CONSUMER_ENVIRONMENT === 'local')
  dotenv.config({ path: "../.env" });

const Environment = {
  DATABASE_HOST: String(process.env["POSTGRES_HOST"]),
  DATABASE_PORT: Number(process.env["POSTGRES_PORT"]),
  DATABASE_USER: String(process.env["POSTGRES_USER"]),
  DATABASE_PASSWORD: String(process.env["POSTGRES_PASSWORD"]),
  DATABASE_NAME: String(process.env["POSTGRES_DB"]),
  SERVICE_USER_MANAGEMENT_URL: String(
    process.env["SERVICE_USER_MANAGEMENT_URL"]
  ),
  SERVICE_NOTIFICATION_URL: String(process.env["SERVICE_NOTIFICATION_URL"]),
  SERVICE_API_AUTH_URL: String(process.env["SERVICE_API_AUTH_URL"]),
  SERVICE_PAYMENT_URL: String(process.env["SERVICE_PAYMENT_URL"]),
  SERVICE_CHARGING_IOT_URL: String(process.env["SERVICE_CHARGING_IOT_URL"]),
  SERVICE_CHARGING_IOT_CHECK_CON_URL: String(
    process.env["SERVICE_CHARGING_IOT_CHECK_CON_URL"]
  ),
  SERVICE_CHARGING_IOT_MANAGE_CHG_URL: String(
    process.env["SERVICE_CHARGING_IOT_MANAGE_CHG_URL"]
  ),
  SERVICE_CHARGING_IOT_COMPLETE_CHG_URL: String(
    process.env["SERVICE_CHARGING_IOT_COMPLETE_CHG_URL"]
  ),
  PAYMENTS_PROCESSING_CRON_SCHEDULE: String(
    process.env.PAYMENTS_PROCESSING_CRON_SCHEDULE
  ),
  PROMO1_FROM_DATE: new Date(process.env["PROMO1_FROM_DATE"] as string),
  PROMO1_TO_DATE: new Date(process.env["PROMO1_TO_DATE"] as string),
  IOT_RETRY_COUNT: Number(process.env['IOT_RETRY_COUNT']) || 4,
  IOT_RETRY_DELAY: Number(process.env['IOT_RETRY_DELAY']) || 2000,
  IOT_CHECK_RETRY_COUNT: Number(process.env.IOT_CHECK_RETRY_COUNT) || 4,
  IOT_CHECK_RETRY_DELAY: Number(process.env.IOT_CHECK_RETRY_DELAY) || 6000
};

export default Environment;
