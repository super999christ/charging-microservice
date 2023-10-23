import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import Environment from "../config/env";

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: Environment.DATABASE_HOST,
  port: Environment.DATABASE_PORT,
  username: Environment.DATABASE_USER,
  password: Environment.DATABASE_PASSWORD,
  database: Environment.DATABASE_NAME,
  entities: ["dist/**/*.entity.js"],
  migrations: ["migrations/*.js"],
  migrationsTableName: "tbl_Migration_History_Charging_Event",
  migrationsRun: false,
};
