import { ApiProperty } from "@nestjs/swagger";

export class RegisterUserDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;
}
