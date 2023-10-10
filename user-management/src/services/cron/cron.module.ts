import { Module } from "@nestjs/common";
import { CronService } from "./cron.service";
import { ScheduleModule } from "@nestjs/schedule";
import { ExternalModule } from "../external/external.module";
import { SubscriptionChargeModule } from "../../database/subscriptionCharge/subscriptionCharge.module";
import { UserModule } from "../../database/user/user.module";

@Module({
  providers: [CronService],
  exports: [CronService],
  imports: [
    ScheduleModule.forRoot(),
    SubscriptionChargeModule,
    UserModule,
    ExternalModule,
  ],
})
export class CronModule {}
