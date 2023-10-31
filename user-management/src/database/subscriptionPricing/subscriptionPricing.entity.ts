import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tbl_Subscription_Pricing")
export class SubscriptionPricing {
  @PrimaryColumn({
    name: "PricingId",
    type: "int",
  })
  id: number;

  @Column({ name: "SubscriptionFee", type: "float", nullable: false })
  subscriptionFee: number;

  @Column({ name: "Active", type: "bool", nullable: false })
  active: boolean;

  @Column({ name: "BillingPlanId", type: "smallint", nullable: false })
  billingPlanId: number;

  @CreateDateColumn({ type: "timestamptz", name: "StartDate" })
  startDate: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "EndDate" })
  endDate: Date;
}