import { ApiProperty } from "@nestjs/swagger";

export class LoginUserDto {
  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  authCode: string;

  @ApiProperty()
  pinCode: string;

  @ApiProperty()
  notificationId: number;
};