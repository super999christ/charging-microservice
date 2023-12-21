import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { ExternalModule } from "../../services/external/external.module";
import { PartnerAccount } from "./partnerAccount.entity";
import { PartnerAccountService } from "./partnerAccount.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([PartnerAccount], AppDataSource),
    ExternalModule,
  ],
  providers: [PartnerAccountService],
  exports: [PartnerAccountService],
})
export class PartnerAccountModule {}
