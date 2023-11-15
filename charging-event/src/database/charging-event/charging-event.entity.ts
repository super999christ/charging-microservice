import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('tbl_Charging_Events')
export class ChargingEvent {
  @PrimaryGeneratedColumn({ name: 'EventId', type: 'bigint' })
  id: number;

  @Column({ name: 'UserId', type: 'varchar' })
  userId: string;

  @Column({ name: 'StationId', type: 'integer' })
  stationId: number;

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

  @Column({ name: 'StationLocation', type: 'varchar', nullable: true })
  stationLocation: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'CreatedDate' })
  createdDate: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'UpdatedDate' })
  updatedDate: Date;
};