import { ApiProperty } from "@nestjs/swagger";

export class StartChargeDto {
  @ApiProperty()
  stationId: number;
};