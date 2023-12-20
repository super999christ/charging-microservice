import { Inject, Injectable } from "@nestjs/common";
import Environment from "../../config/env";
import { ChargingEventService } from "../../database/charging-event/charging-event.service";
import { ChargingIoTService } from "../charging-iot/charging-iot.service";
import { ExternalService } from "../external/external.service";
import { Cron } from "@nestjs/schedule";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { chargingSmsNotificationEnabledStore } from "@root/src/global/store";
import { getNoPowerMessage, getSuccessCompleteMessage } from "@root/src/global/message";

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
          await this.chargingIoTService.completeCharging(event.id);
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
        const { data: user } = await this.externalService.umGetUserById(event.userId);
        const { data: auth } = await this.externalService.asRequestUserToken({
          userId: user.id,
        });
        try {
          const { data: status } =
            await this.chargingIoTService.getChargingStatus(event.id);
          event.chargeStatusPercentage = status.chargeStatusPercentage;
          event.chargeDeliveredKwh = status.chargeDeliveredKwh;
          event.chargeSpeedKwh = status.chargeSpeedKwh;
          event.chargeVehicleRequestedKwh =
            status.chargeVehicleRequestedKwh;
          event.rateActivekWh = status.rateActivekWh;
          event.totalChargeTime = status.sessionTotalDuration
          if (user.billingPlanId != 2) {
            // <> not subscription
            const { data: paymentIntent } =
              await this.externalService.psCompleteCharge(
                {
                  amount: totalCost,
                  idempotencyKey: `transaction_charge_${event.id}`,
                  description: `NXU Charging Event=${event.id}, Station=${event.stationId}`
                },
                `Bearer ${auth.token}`
              );
            if (paymentIntent.id) {
              if (originalSessionStatus === "in_progress")
                event.sessionStatus = "ex_in_progress";
              event.exceptionStatus = "completed";
              event.paymentIntentId = paymentIntent.id;
            }
          } else {
            // is subscription
            if (originalSessionStatus === "in_progress")
              event.sessionStatus = "ex_in_progress_sub";
            event.exceptionStatus = "completed";
          }
          await this.chargingEventService.saveChargingEvent(event);
        } catch (err) {
          this.logger.error(err);
        }
      } catch (err) {
        this.logger.error(err);
      }
    }
  }

  @Cron(Environment.CHARGING_SMS_NOTIFICATION_PROCESSING_CRON_SCHEDUE)
  public async runChargingSMSNotificationProcessing() {
    const eventIds = Object.keys(chargingSmsNotificationEnabledStore);
    for (const key of eventIds) {
      const eventId = Number(key);
      if (chargingSmsNotificationEnabledStore[eventId]) {
        this.sendChargingSMSNotification(eventId);
      }
    }
  }

  public async sendChargingSMSNotification(eventId: number) {
    try {
      const chargingEvent = await this.chargingEventService.getChargingEvent(eventId);
      if (!chargingEvent) {
        throw Error("ChargingEvent not found");
      }
      const user = (await this.externalService.umGetUserById(chargingEvent.userId)).data;
      if (!user) {
        throw Error("ChargingEvent User not found");
      }
      const chargingStatus = (await this.chargingIoTService.getChargingStatus(eventId)).data;
      if (chargingStatus.status != 1) {
        throw Error("ChargingStatus failed with status=0");
      }
      // InProgress status and send SMS notification
      let chargingMessage;
      if (chargingStatus.sessionStatus === 'charging' && chargingStatus.chargeComplete == 0) {
        chargingMessage = `NXU Charging Update:\n ChargingStatus=${chargingStatus.chargeStatusPercentage}\n ChargingTime=${chargingStatus.sessionTotalDuration}`;
      } else if (chargingStatus.chargeComplete == 1 && chargingStatus.sessionTotalCost == 0) {
        // Check for $0 session
        chargingMessage = `
          NXU Charging completed:
          ${getNoPowerMessage()}`;
        delete chargingSmsNotificationEnabledStore[eventId];  // Stop SMS notification
      } else if (chargingStatus.chargeComplete == 1) {
        chargingMessage = `NXU Charging completed:\n ChargingStatus=${chargingStatus.chargeStatusPercentage}\n ChargingTime=${chargingStatus.sessionTotalDuration}\n ChargingCost=${chargingStatus.sessionTotalCost}\n${getSuccessCompleteMessage(user.billingPlanId)}`;
        delete chargingSmsNotificationEnabledStore[eventId];  // Stop SMS notification
      } else {
        // Unknown logic condition don’t know what SessionStatus is, no SMS should be sent
        this.logger.error(`ChargingIOT Error for event (${eventId}) user (${user.phoneNumber}) SessionStatus (${chargingStatus.sessionStatus}) ChargeComplete (${chargingStatus.chargeComplete})`);
      }
      if (chargingMessage) {
        const smsStatus = (await this.externalService.nsSendSMSMessage({
          phoneNumber: user.phoneNumber,
          smsMessage: chargingMessage
        })).data;
        if (smsStatus !== 'success') {
          this.logger.error(`SMS Error for event (${eventId}) user (${user.phoneNumber}) message (${chargingMessage})`);
        } else {
          this.logger.info(`SMS complete for event (${eventId}) user (${user.phoneNumber}) message (${chargingMessage})`);
        }
      }
    } catch (err) {
      this.logger.error(err);
    }
  }
}
