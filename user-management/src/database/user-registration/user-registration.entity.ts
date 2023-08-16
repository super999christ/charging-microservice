import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tbl_User_Registration")
export class UserRegistration {
  @PrimaryGeneratedColumn("uuid", { name: "RegistrationId" })
  id: string;

  @Column({ name: "Email", type: "varchar" })
  email: string;

  @Column({ name: "FirstName", type: "varchar" })
  firstName: string;

  @Column({ name: "LastName", type: "varchar" })
  lastName: string;

  @Column({ name: "PhoneNumber", type: "varchar" })
  phoneNumber: string;

  @Column({ name: "Verified", type: "bool", default: false })
  verified: boolean;

  @Column({ name: "SmsNotificationId", type: "bigint" })
  smsNotificationId: string;

  @Column({ name: "EmailNotificationId", type: "bigint", nullable: true })
  emailNotificationId: string;

  @CreateDateColumn({ type: 'timestamptz', name: "CreatedDate" })
  createdDate: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "UpdatedDate" })
  updatedDate: Date;
}
