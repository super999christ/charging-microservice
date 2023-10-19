import { Module } from "@nestjs/common";
import { ChargingIoTService } from "./charging-iot.service";
import { SimulatorModule } from "../simulator/simulator.module";

@Module({
  providers: [ChargingIoTService],
  exports: [ChargingIoTService],
  imports: [SimulatorModule],
})
export class ChargingIoTModule {}
