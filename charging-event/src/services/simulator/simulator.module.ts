import { Module } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { ChargingEventTestConfigModule } from '../../database/charging-event-test-config/charging-event-test-config.module';

@Module({
  providers: [SimulatorService],
  exports: [SimulatorService],
  imports: [ChargingEventTestConfigModule]
})
export class SimulatorModule {}
