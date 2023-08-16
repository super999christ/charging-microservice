import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('tbl_Charging_Event_Test_Configs')
export class ChargingEventTestConfig {
  @PrimaryGeneratedColumn({ name: 'Id', type: 'integer' })
  id: number;

  @Column({ name: 'TestMode', type: 'bool' })
  testMode: boolean;
  
  @Column({ name: 'IOTMethod', type: 'varchar' })
  iotMethod: string;

  @Column({ name: 'TestData', type: 'varchar' })
  testData: string;
};