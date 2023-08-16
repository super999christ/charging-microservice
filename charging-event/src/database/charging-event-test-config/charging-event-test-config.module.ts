import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../../typeorm/datasource';
import { ChargingEventTestConfig } from './charging-event-test-config.entity';
import { ChargingEventTestConfigService } from './charging-event-test-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargingEventTestConfig], AppDataSource)
  ],
  providers: [ChargingEventTestConfigService],
  exports: [ChargingEventTestConfigService]
})
export class ChargingEventTestConfigModule {
  
}