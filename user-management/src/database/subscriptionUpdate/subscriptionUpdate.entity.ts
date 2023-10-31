import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  PrimaryColumn
} from "typeorm";

@Entity("tbl_Subscription_Updates")
export class SubscriptionUpdate {
  @PrimaryColumn({ name: "UserId", type: "uuid", nullable: false })
  userId: string;

  @PrimaryColumn({ name: "PricingId", type: "int", nullable: false })
  pricingId: number;

  @Column({ name: "Accepted", type: "bool", nullable: false })
  accepted: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "CreatedDate" })
  createdDate: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "UpdatedDate" })
  updatedDate: Date;
}