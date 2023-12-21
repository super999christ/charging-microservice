import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity("tbl_Partners")
export class Partner {
  @PrimaryGeneratedColumn("uuid", { name: "PartnerId" })
  id: string;

  @Column({ name: "PartnerName", type: "varchar", nullable: false })
  partnerName: string;

  @Column({ name: "ContactName", type: "varchar", nullable: false })
  contactName: string;

  @Column({ name: "ContactPhoneNumber", type: "varchar" })
  contactPhoneNumber: string;

  @Column({ name: "Active", type: "bool", nullable: false })
  active: string;

  @CreateDateColumn({ type: "timestamptz", name: "CreatedDate" })
  createdDate: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "UpdatedDate" })
  updatedDate: Date;
}