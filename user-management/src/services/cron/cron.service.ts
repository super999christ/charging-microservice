import { Inject, Injectable } from "@nestjs/common";
import Environment from "../../config/env";
import { ExternalService } from "../external/external.service";
import { SubscriptionChargesService } from "../../database/subscriptionCharges/subscriptionCharges.service";
import { UserService } from "../../database/user/user.service";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class CronService {
  @Inject()
  private externalService: ExternalService;
  @Inject()
  private userService: UserService;
  @Inject()
  private subscriptionChargesService: SubscriptionChargesService;

  @Cron("0 0-23/2 * * *")
  public async runMonthlyBillingRecords() {
    const today = new Date();
    if (today.getDate() !== 1 || today.getHours() < 12)
      return;
    const users = await this.userService.getSubscriptionUsers();
    console.log("@Cron: ", users);
    for (const user of users) {
      try {
        const charges = await this.subscriptionChargesService.findSubscriptionChargesAround(today);
        if (charges.length)
          continue;
        await this.subscriptionChargesService.saveSubscriptionCharges({
          userId: user.id,
          description: 'monthly_fee',
          chargeStatus: 'pending',
          amount: Environment.SUBSCRIPTION_MONTHLY_FEE * user.vehicleCount
        });
      } catch (err) {
        console.error("@Error: ", err);
      }
    }
  }

  @Cron("0 0-23/2 * * *")
  public async runSubscriptionProcessing() {
    const charges = await this.subscriptionChargesService.findPendingSubscriptionCharges();
    for (const charge of charges) {
      try {
        const { data: auth } = await this.externalService.asRequestUserToken({
          userId: charge.userId,
        });
        const { data: paymentIntent } = await this.externalService.psCompleteCharge({
          amount: charge.amount
        }, `Bearer ${auth.token}`);
        if (paymentIntent.id) {
          charge.chargeStatus = 'completed';
          charge.paymentIntentId = paymentIntent.id;
          await this.subscriptionChargesService.saveSubscriptionCharges(charge);
        }
      } catch (err) {
        console.error("@Error: ", err);
      }
    }
  }
}
