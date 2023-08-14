import { Inject, Injectable } from '@nestjs/common';
import { CheckConnectivityDto } from '../charging-iot/dtos/CheckConnectivity.dto';
import { ChargingStatusDto } from '../charging-iot/dtos/ChargingStatus.dto';
import { ManageChargingDto } from '../charging-iot/dtos/ManageCharging.dto';
import { ChargingEventTestConfigService } from '../../database/charging-event-test-config/charging-event-test-config.service';
import { getGlobalChargingStatus, setGlobalChargingStatus } from '../../utils/charging.util';

@Injectable()
export class SimulatorService {
  @Inject()
  private chargingEventTestConfigService: ChargingEventTestConfigService;

  public async checkConnectivity(body: CheckConnectivityDto) {
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

  public async getChargingStatus(body: ChargingStatusDto) {
    const config: any = await this.chargingEventTestConfigService.getTestData('GetChargingStatus');
    if (!config.testMode) {
      return null;
    }
    if (config.testData/* && config.testData['eventId'] === body.eventId*/) {
      return {
        ...config.testData,
        eventStatus: getGlobalChargingStatus(body.eventId)
      };
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

  public async manageCharging(body: ManageChargingDto) {
    const config: any = await this.chargingEventTestConfigService.getTestData('ManageCharging');
    if (!config.testMode) {
      return null;
    }
    if (config.testData/* && config.testData['eventId'] === body.eventId*/) {
      if (config.testData['status']) {
        setGlobalChargingStatus(body.eventId, body.eventType);
      }
      if (body.eventType === 'stop') {
        await this.chargingEventTestConfigService.completeCharging();
      }
      return config.testData;
    }
    return {
      status: 0,
      error: 'Event not found'
    }
  }
}
