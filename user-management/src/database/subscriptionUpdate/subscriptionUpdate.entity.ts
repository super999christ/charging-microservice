import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
} from "typeorm";

@Entity("tbl_Subscription_Updates")
export class SubscriptionUpdate {
  @Column({ name: "UserId", type: "uuid", nullable: false })
  userId: string;

  @Column({ name: "PricingId", type: "bigint", nullable: false })
  pricingId: number;

  @Column({ name: "Accepted", type: "bool", nullable: false })
  accepted: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "CreatedDate" })
  createdDate: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "UpdatedDate" })
  updatedDate: Date;
}