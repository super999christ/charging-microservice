import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../../typeorm/datasource";
import { ExternalModule } from "../../services/external/external.module";
import { BillingPlan } from "./billingPlan.entity";
import { BillingPlanService } from "./billingPlan.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingPlan], AppDataSource),
    ExternalModule,
  ],
  providers: [BillingPlanService],
  exports: [BillingPlanService],
})
export class BillingPlanModule {}
