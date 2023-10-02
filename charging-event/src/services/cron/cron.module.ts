import { Module } from "@nestjs/common";
import { CronService } from "./cron.service";
import { ScheduleModule } from "@nestjs/schedule";
import { ChargingIoTModule } from "../charging-iot/charging-iot.module";
import { ChargingEventModule } from "../../database/charging-event/charging-event.module";
import { ExternalModule } from "../external/external.module";

@Module({
  providers: [CronService],
  exports: [CronService],
  imports: [
    ScheduleModule.forRoot(),
    ChargingIoTModule,
    ChargingEventModule,
    ExternalModule,
  ]
})
export class CronModule {

};