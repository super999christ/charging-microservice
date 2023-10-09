import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { ExternalModule } from "../../services/external/external.module";
import { SubscriptionCharge } from "./subscriptionCharge.entity";
import { SubscriptionChargeService } from "./subscriptionCharge.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionCharge], AppDataSource),
    ExternalModule,
  ],
  providers: [SubscriptionChargeService],
  exports: [SubscriptionChargeService],
})
export class SubscriptionChargeModule {}
