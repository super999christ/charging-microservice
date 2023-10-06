import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { SubscriptionCharges } from "./subscriptionCharges.entity";

@Injectable()
export class SubscriptionChargesService {
  @InjectRepository(SubscriptionCharges)
  private repository: Repository<SubscriptionCharges>;
}
