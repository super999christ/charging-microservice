import { ApiProperty } from "@nestjs/swagger";

export class UpdateCreditCardDto {
  @ApiProperty()
  cardNumber: string;

  @ApiProperty()
  cvc: string;

  @ApiProperty()
  expYear: number;

  @ApiProperty()
  expMonth: number;
}
