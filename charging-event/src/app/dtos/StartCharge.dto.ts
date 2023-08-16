import { ApiProperty } from "@nestjs/swagger";

export class StartChargeDto {
  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  stationId: number;
};