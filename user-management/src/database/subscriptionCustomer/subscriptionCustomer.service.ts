import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { SubscriptionCustomer } from "./subscriptionCustomer.entity";

@Injectable()
export class SubscriptionCustomerService {
  @InjectRepository(SubscriptionCustomer)
  private repository: Repository<SubscriptionCustomer>;

  public async save(subscriptionCustomer: DeepPartial<SubscriptionCustomer>) {
    return this.repository.save(subscriptionCustomer);
  }

  public async findActiveSubscriptionCustomer(phoneNumber: string) {
    const customer = await this.repository.findOneBy({ active: true, phoneNumber });
    return customer ? true : false;
  }
}
