import { ApiProperty } from "@nestjs/swagger";

export class CompleteChargeDto {
  @ApiProperty()
  pmId: string;

  @ApiProperty()
  cusId: string;
  
  @ApiProperty()
  amount: number;
};