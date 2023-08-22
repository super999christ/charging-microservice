import { ApiProperty } from "@nestjs/swagger";

export class SendLoginAuthcodeDto {
  @ApiProperty()
  phoneNumber: string;
}
