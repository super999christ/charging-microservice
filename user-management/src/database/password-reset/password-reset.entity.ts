import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tbl_Password_Resets​")
export class PasswordReset {
  @PrimaryGeneratedColumn("uuid", { name: "PasswordResetId" })
  id: string;

  @Column({ name: "Email", type: "varchar" })
  email: string;

  @Column({ name: "Verified", type: "bool", default: false })
  verified: boolean;

  @Column({ name: "EmailNotificationId", type: "bigint", nullable: true })
  emailNotificationId: string;

  @CreateDateColumn({ type: 'timestamptz', name: "CreatedDate" })
  createdDate: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "UpdatedDate" })
  updatedDate: Date;
}
