import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Partner } from "../partner/partner.entity";

@Entity("tbl_Partner_Accounts")
export class PartnerAccount {
  @PrimaryGeneratedColumn("uuid", { name: "AccountId" })
  id: string;

  @Column({ name: "AccountCode", type: "varchar", nullable: false })
  accountCode: string;

  @Column({ name: "PartnerId", type: "varchar", nullable: false })
  contactName: string;

  @ManyToOne((type) => Partner, { eager: true })
  @JoinColumn({ name: "PartnerId" })
  partner: Partner;

  @Column({ name: "Active", type: "bool", nullable: false })
  active: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "CreatedDate" })
  createdDate: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "UpdatedDate" })
  updatedDate: Date;
}