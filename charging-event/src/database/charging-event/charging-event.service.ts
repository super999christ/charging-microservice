import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Not, Repository } from 'typeorm';
import { ChargingEvent } from './charging-event.entity';

@Injectable()
export class ChargingEventService {
  @InjectRepository(ChargingEvent)
  private chargingEventRepository: Repository<ChargingEvent>;

  public async saveChargingEvent(chargingEvent: DeepPartial<ChargingEvent>) {
    return this.chargingEventRepository.save(chargingEvent);
  }

  public async getChargingEvent(id: number) {
    return this.chargingEventRepository.findOneBy({ id });
  }

  public async getTransactions(phoneNumber: string) {
    return this.chargingEventRepository.find({ where: { phoneNumber, chargeDeliveredKwh: Not(0) }, order: { createdDate: 'DESC' } });
  }
}