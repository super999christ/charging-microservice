import { ApiProperty } from "@nestjs/swagger";

export class ChargingStatusDto {
  @ApiProperty()
  eventId: number;

  @ApiProperty()
  isStopped?: boolean;

  @ApiProperty()
  smsNotificationEnabled?: boolean;
};