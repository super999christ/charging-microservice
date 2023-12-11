import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { ExternalModule } from "../../services/external/external.module";
import { SubscriptionCustomer } from "./subscriptionCustomer.entity";
import { SubscriptionCustomerService } from "./subscriptionCustomer.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionCustomer], AppDataSource),
    ExternalModule,
  ],
  providers: [SubscriptionCustomerService],
  exports: [SubscriptionCustomerService],
})
export class SubscriptionCustomerModule {}
