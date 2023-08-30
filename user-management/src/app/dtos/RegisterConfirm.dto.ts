import { ApiProperty } from "@nestjs/swagger";

export class RegisterConfirmDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  smsNotificationId: number;

  @ApiProperty()
  smsAuthCode: string;

  @ApiProperty()
  emailNotificationId: number;

  @ApiProperty()
  emailAuthCode: string;

  @ApiProperty()
  pinCode: string;
}
