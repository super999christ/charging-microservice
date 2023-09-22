import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

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

  @Column({ name: "Active", type: "bool", default: false })
  active: boolean;

  @Column({ name: "TCFlag", type: "bool", default: false })
  tcFlag: boolean;

  @Column({ name: "ChargingNotify", type: "bool", default: false })
  chargingNotify: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: "CreatedDate" })
  createdDate: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "UpdatedDate" })
  updatedDate: Date;
}
