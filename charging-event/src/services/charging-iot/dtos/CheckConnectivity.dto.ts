import { ApiProperty } from "@nestjs/swagger";

export class CheckConnectivityDto {
  @ApiProperty()
  eventId: number;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  stationId: number;
};