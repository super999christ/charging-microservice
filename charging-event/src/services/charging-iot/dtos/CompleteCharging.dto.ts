import { ApiProperty } from "@nestjs/swagger";

export class CompleteChargingDto {
  @ApiProperty()
  eventId: number;
}