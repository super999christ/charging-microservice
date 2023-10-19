import { Inject, Injectable } from "@nestjs/common";
import Environment from "../../config/env";
import { ChargingEventService } from "../../database/charging-event/charging-event.service";
import { ChargingIoTService } from "../charging-iot/charging-iot.service";
import { ExternalService } from "../external/external.service";
import { Cron } from "@nestjs/schedule";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";

@Injectable()
export class CronService {
  @Inject()
  private chargingIoTService: ChargingIoTService;
  @Inject()
  private chargingEventService: ChargingEventService;
  @Inject()
  private externalService: ExternalService;
  @InjectPinoLogger(CronService.name)
  private readonly logger: PinoLogger;

  @Cron(Environment.PAYMENTS_PROCESSING_CRON_SCHEDULE)
  public async runOfflineProcessing() {
    this.logger.info("Running payments processing cron job...");

    const chargingEvents =
      await this.chargingEventService.getPendingChargingEvents();

    for (const event of chargingEvents) {
      const originalSessionStatus = event.sessionStatus;
      try {
        const { data: chargingData } =
          await this.chargingIoTService.completeCharging({
            eventId: event.id,
          });
        const timeZone = "America/Los_Angeles";
        const today = new Date().toLocaleString("sv", { timeZone });
        const PROMO1_FROM_DATE = Environment.PROMO1_FROM_DATE.toLocaleString(
          "sv",
          { timeZone }
        );
        const PROMO1_TO_DATE = Environment.PROMO1_TO_DATE.toLocaleString("sv", {
          timeZone,
        });

        let totalCost =
          Number(chargingData.sessionTotalCost) &&
          Math.max(chargingData.sessionTotalCost, 0.5);
        event.totalCostDollars = totalCost;
        if (PROMO1_FROM_DATE <= today && today < PROMO1_TO_DATE) {
          totalCost = Math.min(totalCost, 1);
        }
        const { data: user } = await this.externalService.umValidatePhone({
          phoneNumber: event.phoneNumber,
        });
        const { data: auth } = await this.externalService.asRequestUserToken({
          userId: user.id,
        });
        try {
          const { data: status } =
            await this.chargingIoTService.getChargingStatus({
              eventId: event.id,
              phoneNumber: event.phoneNumber,
              stationId: event.stationId,
            });
          if (user.billingPlanId != 2) {
            // <> not subscription
            const { data: paymentIntent } =
              await this.externalService.psCompleteCharge(
                {
                  amount: totalCost,
                  idempotencyKey: `transaction_charge_${event.id}`,
                },
                `Bearer ${auth.token}`
              );
            if (paymentIntent.id) {
              if (originalSessionStatus === "in_progress")
                event.sessionStatus = "ex_in_progress";
              event.exceptionStatus = "completed";
              event.paymentIntentId = paymentIntent.id;
              event.chargeStatusPercentage = status.chargeStatusPercentage;
              event.chargeDeliveredKwh = status.chargeDeliveredKwh;
              event.chargeSpeedKwh = status.chargeSpeedKwh;
              event.chargeVehicleRequestedKwh =
                status.chargeVehicleRequestedKwh;
              event.rateActivekWh = status.rateActivekWh;
              event.totalChargeTime = status.sessionTotalDuration;
              await this.chargingEventService.saveChargingEvent(event);
            }
          } else {
            // is transaction
            event.sessionStatus = "completed_sub";
            await this.chargingEventService.saveChargingEvent(event);
          }
        } catch (err) {
          this.logger.error(err);
        }
      } catch (err) {
        this.logger.error(err);
      }
    }
  }
}
