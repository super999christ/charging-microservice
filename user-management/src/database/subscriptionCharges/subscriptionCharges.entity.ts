import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tbl_Subscription_Charges")
export class SubscriptionCharges {
  @PrimaryColumn("uuid", { name: "UserId" })
  userId: string;

  @Column({ name: "Amount", type: "float", nullable: false })
  amount: number;

  @Column({ name: "Description", type: "varchar", default: true })
  description: string;

  @Column({ name: "ChargeStatus", type: "varchar", default: true })
  chargeStatus: string;

  @Column({ name: "PaymentIntentId", type: "varchar", nullable: true })
  paymentIntentId: string;

  @CreateDateColumn({ type: "timestamptz", name: "CreatedDate" })
  createdDate: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "UpdatedDate" })
  updatedDate: Date;
}
