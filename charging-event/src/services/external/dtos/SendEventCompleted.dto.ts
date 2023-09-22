export class SendEventCompletedDto {
  eventId: number;
  type: 'email' | 'sms';
  email?: string;
  phoneNumber?: string;
};