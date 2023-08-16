import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { ExternalModule } from "../../services/external/external.module";
import { PasswordReset } from "./password-reset.entity";
import { PasswordResetService } from "./password-reset.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([PasswordReset], AppDataSource),
    ExternalModule,
  ],
  providers: [PasswordResetService],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}
