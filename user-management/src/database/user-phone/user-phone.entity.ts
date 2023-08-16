import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../user/user.entity";

@Entity('tbl_User_Phones')
export class UserPhone {
  @PrimaryGeneratedColumn({ name: 'PhoneId', type: 'bigint' })
  id: number;

  @ManyToOne(type => User)
  @JoinColumn({ name: 'UserId' })
  user: User;

  @Column({ name: 'PhoneNumber', type: 'varchar' })
  phoneNumber: string;

  @Column({ name: 'Active', type: 'bool', default: false })
  active: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'CreatedDate' })
  createdDate: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'UpdatedDate' })
  updatedDate: Date;
};