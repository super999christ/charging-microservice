import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, DeepPartial, Repository } from "typeorm";
import { SubscriptionCharges } from "./subscriptionCharges.entity";

@Injectable()
export class SubscriptionChargesService {
  @InjectRepository(SubscriptionCharges)
  private repository: Repository<SubscriptionCharges>;

  public async saveSubscriptionCharges(subscriptionCharges: DeepPartial<SubscriptionCharges>) {
    return await this.repository.save(subscriptionCharges);
  }

  public async findSubscriptionChargesAround(userId: string, date: Date) {
    const startDate = new Date(date.getTime() - 3600 * 24 * 1000);
    const endDate = new Date(date.getTime() + 3600 * 24 * 1000);
    return await this.repository.find({
      where: {
        createdDate: Between(startDate, endDate),
        chargeStatus: 'pending',
        userId
      }
    });
  }

  public async findPendingSubscriptionCharges() {
    return await this.repository.find({
      where: {
        chargeStatus: 'pending'
      }
    });
  }
}
