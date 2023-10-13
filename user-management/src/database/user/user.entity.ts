import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { BillingPlan } from "../billingPlan/billingPlan.entity";

@Entity("tbl_Users")
export class User {
  @PrimaryGeneratedColumn("uuid", { name: "UserId" })
  id: string;

  @Column({ name: "Email", type: "varchar" })
  email: string;

  @Column({ name: "PhoneNumber", type: "varchar", nullable: true })
  phoneNumber: string;

  @Column({ name: "Password", type: "varchar" })
  password: string;

  @Column({ name: "FirstName", type: "varchar" })
  firstName: string;

  @Column({ name: "LastName", type: "varchar" })
  lastName: string;

  @Column({ name: "Verified", type: "bool", default: false })
  verified: boolean;

  @Column({ name: "Active", type: "bool", default: true })
  active: boolean;

  @Column({ name: "TCFlag", type: "bool", default: false })
  tcFlag: boolean;

  @Column({ name: "ChargingNotify", type: "bool", default: false })
  chargingNotify: boolean;

  @Column({ name: "StripeCustomerId", type: "varchar", default: "" })
  stripeCustomerId: string;

  @Column({ name: "BillingPlanId", type: "bigint", default: 1, nullable: true })
  billingPlanId: number;

  @OneToOne((type) => BillingPlan, { eager: true })
  @JoinColumn({ name: "BillingPlanId" })
  billingPlan: BillingPlan;

  @Column({ name: "VehicleCount", type: "bigint", default: 1, nullable: true })
  vehicleCount: number;

  @CreateDateColumn({ type: "timestamptz", name: "CreatedDate" })
  createdDate: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "UpdatedDate" })
  updatedDate: Date;
}
