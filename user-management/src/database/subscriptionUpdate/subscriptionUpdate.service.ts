import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { SubscriptionUpdate } from "./subscriptionUpdate.entity";

@Injectable()
export class SubscriptionUpdateService {
  @InjectRepository(SubscriptionUpdate)
  private repository: Repository<SubscriptionUpdate>;

  public async save(subscriptionUpdate: DeepPartial<SubscriptionUpdate>) {
    return this.repository.save(subscriptionUpdate);
  }

  public async saveSubscriptionUpdate(
    subscriptionUpdate: DeepPartial<SubscriptionUpdate>
  ) {
    return await this.repository.save(subscriptionUpdate);
  }

  public async getNonAcceptedSubscriptionUpdatesByUserId(userId: string) {
    return await this.repository.findBy({ userId, accepted: false });
  }

  public async getSubscriptionupdatesbyUserId(userId: string) {
    return await this.repository.findBy({ userId, pricingId: 2 });
  }
}
