import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository, Between } from "typeorm";
import { SubscriptionCharge } from "./subscriptionCharge.entity";

@Injectable()
export class SubscriptionChargeService {
  @InjectRepository(SubscriptionCharge)
  private repository: Repository<SubscriptionCharge>;

  public async save(subscriptionCharge: DeepPartial<SubscriptionCharge>) {
    return this.repository.save(subscriptionCharge);
  }

  public async saveSubscriptionCharges(
    subscriptionCharges: DeepPartial<SubscriptionCharge>
  ) {
    return await this.repository.save(subscriptionCharges);
  }

  public async findSubscriptionChargesAround(userId: string, date: Date) {
    const startDate = new Date(date.getTime() - 3600 * 24 * 1000);
    const endDate = new Date(date.getTime() + 3600 * 24 * 1000);
    return await this.repository.find({
      where: {
        createdDate: Between(startDate, endDate),
        chargeStatus: "pending",
        description: 'monthly_fee',
        userId,
      },
    });
  }

  public async findPendingSubscriptionCharges() {
    return await this.repository.find({
      where: {
        chargeStatus: "pending",
      },
    });
  }

  public async findMonthlySubscriptionCharges(userId: string, date: Date) {
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    return await this.repository.find({
      where: {
        createdDate: Between(startDate, date),
        userId,
      },
    });
  }
}
