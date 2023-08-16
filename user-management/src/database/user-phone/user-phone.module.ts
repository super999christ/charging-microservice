import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { UserPhone } from "./user-phone.entity";
import { UserPhoneService } from "./user-phone.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPhone], AppDataSource)
  ],
  providers: [UserPhoneService],
  exports: [UserPhoneService]
})
export class UserPhoneModule {

};