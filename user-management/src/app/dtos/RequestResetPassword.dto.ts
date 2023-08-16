import { ApiProperty } from "@nestjs/swagger";

export class RequestResetPasswordDto {
  @ApiProperty()
  email: string;
}
