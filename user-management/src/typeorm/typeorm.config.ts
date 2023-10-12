import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import Environment from "../config/env";

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: "stage-db-psql-charging-1.cizjbxfi5ccd.us-west-2.rds.amazonaws.com", //  Environment.DATABASE_HOST,
  port: 5432, //Environment.DATABASE_PORT,
  username: "postgres", // Environment.DATABASE_USER,
  password: "MD2P!JcBlktnGz!P]y5LG?r}o5k[", //Environment.DATABASE_PASSWORD,
  database: "nxuenergy", //Environment.DATABASE_NAME,
  entities: ["dist/**/*.entity.js"],
  migrations: ["migrations/*.js"],
  migrationsTableName: "tbl_Migration_History_User_Management",
  migrationsRun: true,
};
