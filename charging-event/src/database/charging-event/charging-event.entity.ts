import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('tbl_Charging_Events')
export class ChargingEvent {
  @PrimaryGeneratedColumn({ name: 'ChargingEventId', type: 'bigint' })
  id: number;

  @Column({ name: 'PhoneNumber', type: 'varchar' })
  phoneNumber: string;

  @Column({ name: 'StationId', type: 'integer' })
  stationId: number;

  @Column({ name: 'NotificationId', type: 'integer', nullable: true })
  notificationId: number;

  @Column({ name: 'StationOnline', type: 'bool', default: false })
  stationOnline: boolean;

  @Column({ name: 'StationError', type: 'varchar', nullable: true })
  stationError: string;

  @Column({ name: 'CCAuth', type: 'bool', default: false })
  ccAuth: boolean;

  @Column({ name: 'CCCharge', type: 'bool', default: false })
  ccCharge: boolean;

  @Column({ name: 'CCAmount', type: 'float', default: 0 })
  ccAmount: number;

  @Column({ name: 'ChargeStatusPercentage', type: 'float', default: 0 })
  chargeStatusPercentage: number;

  @Column({ name: 'ChargeDeliveredKWH', type: 'float', default: 0 })
  chargeDeliveredKwh: number;

  @Column({ name: 'ChargeSpeedKW', type: 'float', default: 0 })
  chargeSpeedKwh: number;

  @Column({ name: 'ChargeVehicleRequestedKW', type: 'float', default: 0 })
  chargeVehicleRequestedKwh: number;

  @Column({ name: 'TotalCostDollars', type: 'float', default: 0 })
  totalCostDollars: number;

  @Column({ name: 'TotalChargeTime', type: 'float', default: 0 })
  totalChargeTime: number;

  @Column({ name: 'SessionStatus', type: 'varchar', nullable: true })
  sessionStatus: string;

  @Column({ name: 'RateActiveKWH', type: 'float', default: 0 })
  rateActivekWh: number;

  @Column({ name: 'ExceptionStatus', type: 'varchar', nullable: true })
  exceptionStatus: string;

  @Column({ name: 'PaymentIntentId', type: 'varchar', nullable: true })
  paymentIntentId: string;

  @Column({ name: 'SMSAuthValid', type: 'bool', default: false })
  smsAuthValid: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'CreatedDate' })
  createdDate: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'UpdatedDate' })
  updatedDate: Date;
};