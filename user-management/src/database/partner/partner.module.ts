import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { ExternalModule } from "../../services/external/external.module";
import { Partner } from "./partner.entity";
import { PartnerService } from "./partner.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Partner], AppDataSource),
    ExternalModule,
  ],
  providers: [PartnerService],
  exports: [PartnerService],
})
export class PartnerModule {}
