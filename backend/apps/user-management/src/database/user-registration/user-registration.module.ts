import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { ExternalModule } from "../../services/external/external.module";
import { UserRegistration } from "./user-registration.entity";
import { UserRegistrationService } from "./user-registration.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRegistration], AppDataSource),
    ExternalModule,
  ],
  providers: [UserRegistrationService],
  exports: [UserRegistrationService],
})
export class UserRegistrationModule {}
