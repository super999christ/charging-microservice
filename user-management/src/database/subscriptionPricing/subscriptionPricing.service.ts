import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { SubscriptionPricing } from "./subscriptionPricing.entity";

@Injectable()
export class SubscriptionPricingService {
  @InjectRepository(SubscriptionPricing)
  private repository: Repository<SubscriptionPricing>;

  public async save(subscriptionPricing: DeepPartial<SubscriptionPricing>) {
    return this.repository.save(subscriptionPricing);
  }

  public async saveSubscriptionPricing(
    subscriptionPricing: DeepPartial<SubscriptionPricing>
  ) {
    return await this.repository.save(subscriptionPricing);
  }

  public async getActiveSubscriptionPricing() {
    return await this.repository.findOneBy({ active: true });
  }
}
