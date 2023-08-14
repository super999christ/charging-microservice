import { ApiProperty } from "@nestjs/swagger";

export class SendPasswordResetLink {
  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  paramString?: string;
}
