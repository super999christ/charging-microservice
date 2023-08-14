import { ApiProperty } from "@nestjs/swagger";

export class ValidatePhoneDto {
  @ApiProperty()
  phoneNumber: string;
};