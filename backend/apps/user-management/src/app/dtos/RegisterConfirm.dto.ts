import { ApiProperty } from "@nestjs/swagger";

export class RegisterConfirmDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  cardNumber: string;

  @ApiProperty()
  expYear: number;

  @ApiProperty()
  expMonth: number;

  @ApiProperty()
  cvc: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  smsNotificationId: number;

  @ApiProperty()
  smsAuthCode: string;

  @ApiProperty()
  emailNotificationId: number;

  @ApiProperty()
  emailAuthCode: string;

  @ApiProperty()
  rId: string;
}