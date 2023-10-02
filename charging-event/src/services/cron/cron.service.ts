import { Inject, Injectable } from "@nestjs/common";
import axios from "axios";
import Environment from "../../config/env";
import { ChargingEventService } from "../../database/charging-event/charging-event.service";
import { ChargingIoTService } from "../charging-iot/charging-iot.service";
import { ExternalService } from "../external/external.service";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class CronService {
  @Inject()
  private chargingIoTService: ChargingIoTService;
  @Inject()
  private chargingEventService: ChargingEventService;
  @Inject()
  private externalService: ExternalService;

  @Cron("0 0-23/2 * * *")
  // @Cron("0 */2 * * * *")
  public async runOfflineProcessing() {
    const chargingEvents = await this.chargingEventService.getPendingChargingEvents();
    console.log("@Cron: ", chargingEvents);
    for (const event of chargingEvents) {
      const originalSessionStatus = event.sessionStatus;
      try {
        const { data: chargingData } = await this.chargingIoTService.completeCharging({
          eventId: event.id
        });
        const timeZone = 'America/Los_Angeles';
        const today = new Date().toLocaleString('sv', { timeZone });
        const PROMO1_FROM_DATE = Environment.PROMO1_FROM_DATE.toLocaleString('sv', { timeZone });
        const PROMO1_TO_DATE = Environment.PROMO1_TO_DATE.toLocaleString('sv', { timeZone });

        let totalCost = Number(chargingData.sessionTotalCost) && Math.max(chargingData.sessionTotalCost, 0.5);
        event.totalCostDollars = totalCost;
        if (PROMO1_FROM_DATE <= today && today < PROMO1_TO_DATE) {
          totalCost = Math.min(totalCost, 1);
        }
        const { data: user } = await this.externalService.umValidatePhone({ phoneNumber: event.phoneNumber });
        const { data: auth } = await this.externalService.asRequestUserToken({
          userId: user.id,
        });
        try {
          const { data: status } = await this.chargingIoTService.getChargingStatus({
            eventId: event.id,
            phoneNumber: event.phoneNumber,
            stationId: event.stationId
          });
          const { data: paymentIntent } = await this.externalService.psCompleteCharge({
            amount: totalCost,
          }, `Bearer ${auth.token}`);
          if (paymentIntent.id) {
            if (originalSessionStatus === 'in_progress')
              event.sessionStatus = 'ex_in_progress';
            event.exceptionStatus = 'completed';
            event.paymentIntentId = paymentIntent.id;
            event.chargeStatusPercentage = status.chargeStatusPercentage;
            event.chargeDeliveredKwh = status.chargeDeliveredKwh;
            event.chargeSpeedKwh = status.chargeSpeedKwh;
            event.chargeVehicleRequestedKwh = status.chargeVehicleRequestedKwh;
            event.rateActivekWh = status.rateActivekWh;
            event.totalChargeTime = status.sessionTotalDuration;
            await this.chargingEventService.saveChargingEvent(event);
          }
        } catch (err) {
          // TODO: replace the below with PinoLogger
          console.error("@Error: ", err);
        }
      } catch (err) {
        console.error("@Error", err)
      }
    }
  }
}
