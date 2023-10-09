import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tbl_Billing_Plans")
export class BillingPlan {
  @PrimaryGeneratedColumn("increment", { name: "BillingPlanId" })
  id: number;

  @Column({ name: "BillingPlan", type: "varchar", nullable: false })
  billingPlan: string;

  @Column({ name: "Active", type: "bool", default: true })
  active: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "CreatedDate" })
  createdDate: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "UpdatedDate" })
  updatedDate: Date;
}
