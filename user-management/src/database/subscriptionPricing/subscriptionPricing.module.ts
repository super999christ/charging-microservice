import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { ExternalModule } from "../../services/external/external.module";
import { SubscriptionPricing } from "./subscriptionPricing.entity";
import { SubscriptionPricingService } from "./subscriptionPricing.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPricing], AppDataSource),
    ExternalModule,
  ],
  providers: [SubscriptionPricingService],
  exports: [SubscriptionPricingService],
})
export class SubscriptionPricingModule {}
