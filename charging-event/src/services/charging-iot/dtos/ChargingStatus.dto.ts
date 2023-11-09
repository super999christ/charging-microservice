import { ApiProperty } from "@nestjs/swagger";

export class ChargingStatusDto {
  @ApiProperty()
  eventId: number;

  @ApiProperty()
  iotException?: boolean;
};