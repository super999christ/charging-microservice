import { ApiProperty } from "@nestjs/swagger";

export class ManageChargingDto {
  @ApiProperty()
  eventId: number;

  @ApiProperty()
  eventType: 'start' | 'pause' | 'resume' | 'stop';
}