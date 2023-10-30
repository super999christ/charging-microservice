import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tbl_Subscription_Pricing")
export class SubscriptionPricing {
  @PrimaryGeneratedColumn("increment", {
    name: "PricingId",
    type: "bigint",
  })
  id: number;

  @Column({ name: "SubscriptionFee", type: "float", nullable: false })
  subscriptionFee: number;

  @Column({ name: "Active", type: "bool", nullable: false })
  active: boolean;

  @Column({ name: "BillingPlanId", type: "int", nullable: false })
  billingPlanId: number;

  @CreateDateColumn({ type: "timestamptz", name: "StartDate" })
  startDate: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "EndDate" })
  endDate: Date;
}