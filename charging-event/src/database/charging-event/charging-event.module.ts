import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../../typeorm/datasource';
import { ChargingEvent } from './charging-event.entity';
import { ChargingEventService } from './charging-event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargingEvent], AppDataSource)
  ],
  providers: [ChargingEventService],
  exports: [ChargingEventService]
})
export class ChargingEventModule {
  
}