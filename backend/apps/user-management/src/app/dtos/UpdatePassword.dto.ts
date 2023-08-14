import { ApiProperty } from "@nestjs/swagger";

export class UpdatePasswordDto {
  @ApiProperty()
  password: string;
}
