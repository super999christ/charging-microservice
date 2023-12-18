import { Injectable } from "@nestjs/common";
import { ValidatePhoneDto } from "./dtos/ValidatePhone.dto";
import axios from "axios";
import Environment from "../../config/env";
import { SendSMSAuthCodeDto } from "./dtos/SendSMSAuthCode.dto";
import { ValidateSMSAuthCodeDto } from "./dtos/ValidateSMSAuthCode.dto";
import { CompleteChargeDto } from "./dtos/CompleteCharge.dto";
import { SendEventCompletedDto } from "./dtos/SendEventCompleted.dto";
import { RequestUserTokenDto } from "./dtos/RequestUserTokenDto.dto";
import { SendSMSMessageDto } from "./dtos/SendSMSMessage.dto";

@Injectable()
export class ExternalService {
  public async umGetUserById(userId: string) {
    return axios.get(`${Environment.SERVICE_USER_MANAGEMENT_URL}/get-user?userId=${userId}`);
  }

  public async umGetProfile(authorization: string) {
    return axios.get(`${Environment.SERVICE_USER_MANAGEMENT_URL}/profile`, {
      headers: { Authorization: authorization }
    });
  }

  public async nsSendSMSMessage(body: SendSMSMessageDto) {
    return axios.post(`${Environment.SERVICE_NOTIFICATION_URL}/send-sms-message`, body);
  }

  public async nsSendSMSAuthCode(body: SendSMSAuthCodeDto) {
    return axios.post(`${Environment.SERVICE_NOTIFICATION_URL}/send-sms-authcode`, body);
  }

  public async nsValidateSMSAuthCode(body: ValidateSMSAuthCodeDto) {
    return axios.post(`${Environment.SERVICE_NOTIFICATION_URL}/validate-sms-authcode`, body);
  }

  public async psCompleteCharge(body: CompleteChargeDto, authorization: string) {
    return axios.post(
      `${Environment.SERVICE_PAYMENT_URL}/complete-charge`,
      body,
      { headers: { Authorization: authorization } }
    );
  }

  public async nsSendEventCompleted(body: SendEventCompletedDto) {
    return axios.post(
      `${Environment.SERVICE_NOTIFICATION_URL}/send-event-completed`,
      body
    );
  }

  public async asRequestUserToken(body: RequestUserTokenDto) {
    return axios.post(
      `${Environment.SERVICE_API_AUTH_URL}/request-user-token`,
      body
    );
  }
};