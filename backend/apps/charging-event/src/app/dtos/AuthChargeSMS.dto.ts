import { ApiProperty } from "@nestjs/swagger";

export class AuthChargeSMSDto {
  @ApiProperty()
  notificationId: number;

  @ApiProperty()
  chargingEventId: number;
  
  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  authCode: string;
};