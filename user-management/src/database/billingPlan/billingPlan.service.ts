import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { BillingPlan } from "./billingPlan.entity";

@Injectable()
export class BillingPlanService {
  @InjectRepository(BillingPlan)
  private repository: Repository<BillingPlan>;

  public async getBillingPlans() {
    return await this.repository.find();
  }
}
