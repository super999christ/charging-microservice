import { Inject, Injectable } from "@nestjs/common";
import Environment from "../../config/env";
import { ExternalService } from "../external/external.service";
import { SubscriptionChargeService } from "../../database/subscriptionCharge/subscriptionCharge.service";
import { UserService } from "../../database/user/user.service";
import { Cron } from "@nestjs/schedule";
import { PinoLogger, InjectPinoLogger } from "nestjs-pino";

@Injectable()
export class CronService {
  @Inject()
  private externalService: ExternalService;
  @Inject()
  private userService: UserService;
  @Inject()
  private subscriptionChargesService: SubscriptionChargeService;

  @InjectPinoLogger(CronService.name)
  private readonly logger: PinoLogger;

  @Cron(Environment.SUBSCRIPTION_PROCESSING_CRON_SCHEDULE)
  public async runSubscriptionProcessing() {
    this.logger.info("Running subscription processing cron job...");

    const today = new Date();
    if (today.getDate() === 1) {
      const users = await this.userService.getSubscriptionUsers();
      for (const user of users) {
        try {
          const charges =
            await this.subscriptionChargesService.findSubscriptionChargesAround(
              user.id,
              today
            );
          if (charges.length) continue;
          await this.subscriptionChargesService.saveSubscriptionCharges({
            userId: user.id,
            description: "monthly_fee",
            chargeStatus: "pending",
            amount:
              Environment.SUBSCRIPTION_MONTHLY_FEE /* * user.vehicleCount*/,
          });
        } catch (err) {
          this.logger.error(err);
        }
      }
    }

    const charges =
      await this.subscriptionChargesService.findPendingSubscriptionCharges();
    for (const charge of charges) {
      try {
        const { data: auth } = await this.externalService.asRequestUserToken({
          userId: charge.userId,
        });
        const { data: paymentIntent } =
          await this.externalService.psCompleteCharge(
            {
              amount: charge.amount,
            },
            `Bearer ${auth.token}`
          );
        if (paymentIntent.id) {
          charge.chargeStatus = "completed";
          charge.paymentIntentId = paymentIntent.id;
          await this.subscriptionChargesService.saveSubscriptionCharges(charge);
        }
      } catch (err) {
        this.logger.error(err);
      }
    }
  }
}
