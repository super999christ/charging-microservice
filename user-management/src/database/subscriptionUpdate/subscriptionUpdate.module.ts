import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { ExternalModule } from "../../services/external/external.module";
import { SubscriptionUpdate } from "./subscriptionUpdate.entity";
import { SubscriptionUpdateService } from "./subscriptionUpdate.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionUpdate], AppDataSource),
    ExternalModule,
  ],
  providers: [SubscriptionUpdateService],
  exports: [SubscriptionUpdateService],
})
export class SubscriptionUpdateModule {}
