import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargingEventTestConfig } from './charging-event-test-config.entity';

@Injectable()
export class ChargingEventTestConfigService {
  @InjectRepository(ChargingEventTestConfig)
  private chargingEventTestConfigRepository: Repository<ChargingEventTestConfig>;

  public async getTestData(iotMethod: string) {
    const config = await this.chargingEventTestConfigRepository.findOneBy({ iotMethod });
    if (config) {
      return {
        ...config,
        testData: JSON.parse(config.testData)
      };
    }
    return {};
  }

  public async completeCharging() {
    const config = await this.chargingEventTestConfigRepository.findOneBy({ iotMethod: 'GetChargingStatus' });
    if (config) {
      const data = JSON.parse(config.testData);
      config.testData = JSON.stringify({
        ...data,
        chargeComplete: 1
      });
      await this.chargingEventTestConfigRepository.save(config);
    }
  }
}