import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  PrimaryColumn
} from "typeorm";

@Entity("tbl_Subscription_Customers")
export class SubscriptionCustomer {
  @PrimaryColumn({ name: "PhoneNumber", type: "varchar", nullable: false })
  phoneNumber: string;

  @Column({ name: "Active", type: "bool", nullable: false })
  active: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "CreatedDate" })
  createdDate: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "UpdatedDate" })
  updatedDate: Date;
}