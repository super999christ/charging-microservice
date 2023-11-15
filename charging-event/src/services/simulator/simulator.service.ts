import { Inject, Injectable } from '@nestjs/common';
import { ChargingEventTestConfigService } from '../../database/charging-event-test-config/charging-event-test-config.service';

@Injectable()
export class SimulatorService {
  @Inject()
  private chargingEventTestConfigService: ChargingEventTestConfigService;

  public async checkConnectivity() {
    const config: any = await this.chargingEventTestConfigService.getTestData('CheckConnectivity');
    if (!config.testMode) {
      return null;
    }
    if (config.testData/* && config.testData['eventId'] === body.eventId*/)
      return config.testData;
    return {
      status: 0,
      error: 'Event not found'
    };
  }

  public async getChargingStatus() {
    const config: any = await this.chargingEventTestConfigService.getTestData('GetChargingStatus');
    if (!config.testMode) {
      return null;
    }
    if (config.testData/* && config.testData['eventId'] === body.eventId*/) {
      return config.testData;
    }
    return {
      status: 0,
      chargeComplete: 0,
      chargeStatusPercentage: 0,
      chargeDeliveredKwh: 0,
      chargeSpeedKwh: 0,
      chargeVehicleRequestedKwh: 0,
      rateActivekWh: 0,
      sessionTotalCost: 0,
      sessionTotalDuration: 0,
      sessionStatus: 'unavailable',
      error: 'Event not found'
    }
  }

  public async manageCharging() {
    const config: any = await this.chargingEventTestConfigService.getTestData('ManageCharging');
    if (!config.testMode) {
      return null;
    }
    if (config.testData/* && config.testData['eventId'] === body.eventId*/) {
      return config.testData;
    }
    return {
      status: 0,
      error: 'Event not found'
    }
  }

  public async completeCharging() {
    const config: any = await this.chargingEventTestConfigService.getTestData('CompleteCharging');
    if (!config.testMode) {
      return null;
    }
    if (config.testData) {
      return config.testData;
    }
    return {
      status: 0,
      chargeComplete: 0,
      chargeStatusPercentage: 0,
      chargeDeliveredKwh: 0,
      chargeSpeedKwh: 0,
      chargeVehicleRequestedKwh: 0,
      rateActivekWh: 0,
      sessionTotalCost: 0,
      sessionTotalDuration: 0,
      error: 'Event not found'
    }
  }
}
