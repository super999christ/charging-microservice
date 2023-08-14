import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { ExternalModule } from "../../services/external/external.module";
import { User } from "./user.entity";
import { UserService } from "./user.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User], AppDataSource),
    ExternalModule
  ],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {

};