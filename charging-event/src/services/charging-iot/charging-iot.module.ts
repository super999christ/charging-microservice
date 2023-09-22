import { Module } from "@nestjs/common";
import { ChargingIoTService } from "./charging-iot.service";
import { SimulatorModule } from "../simulator/simulator.module";
import { LoggerModule } from "nestjs-pino";

@Module({
  providers: [ChargingIoTService],
  exports: [ChargingIoTService],
  imports: [SimulatorModule, LoggerModule]
})
export class ChargingIoTModule {

};