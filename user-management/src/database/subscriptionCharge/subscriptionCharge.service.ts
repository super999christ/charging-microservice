import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { SubscriptionCharge } from "./subscriptionCharge.entity";

@Injectable()
export class SubscriptionChargeService {
  @InjectRepository(SubscriptionCharge)
  private repository: Repository<SubscriptionCharge>;

  public async save(subscriptionCharge: DeepPartial<SubscriptionCharge>) {
    return this.repository.save(subscriptionCharge);
  }
}
