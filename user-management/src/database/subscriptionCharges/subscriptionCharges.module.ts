import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { ExternalModule } from "../../services/external/external.module";
import { SubscriptionCharges } from "./subscriptionCharges.entity";
import { SubscriptionChargesService } from "./subscriptionCharges.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionCharges], AppDataSource),
    ExternalModule,
  ],
  providers: [SubscriptionChargesService],
  exports: [SubscriptionChargesService],
})
export class SubscriptionChargesModule {}
