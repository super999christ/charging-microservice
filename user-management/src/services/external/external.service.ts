import { Injectable } from "@nestjs/common";
import { WriteLogDto } from "./dtos/WriteLog.dto";
import axios from "axios";
import Environment from "../../config/env";
import { SendEmailAuthCodeDto } from "./dtos/SendEmailAuthCodeDto";
import { ValidateEmailAuthCodeDto } from "./dtos/ValidateEmailAuthCodeDto";
import { SendSMSAuthCodeDto } from "./dtos/SendSMSAuthCode.dto";
import { ValidateSMSAuthCodeDto } from "./dtos/ValidateSMSAuthCode.dto";
import { SendPasswordResetLink } from "./dtos/SendPasswordResetLink.dto";
import { RequestUserTokenDto } from "./dtos/RequestUserToken";
import { RequestUserTokenBodyDto } from "./dtos/RequestUserTokenBody";

@Injectable()
export class ExternalService {
  public async lgWriteLog(logDetails: WriteLogDto) {
    return axios.post(`${Environment.SERVICE_LOGGER_URL}/logs`, logDetails);
  }

  public async lgGetLogs() {
    return axios.get(`${Environment.SERVICE_LOGGER_URL}/logs`);
  }

  public async neSendEmailAuthCode(body: SendEmailAuthCodeDto) {
    return axios.post(
      `${Environment.SERVICE_NOTIFICATION_URL}/send-email-authcode`,
      body
    );
  }

  public async neSendPasswordResetLink(body: SendPasswordResetLink) {
    return axios.post(
      `${Environment.SERVICE_NOTIFICATION_URL}/send-password-reset-request`,
      body
    );
  }

  public async neValidateEmailAuthCode(body: ValidateEmailAuthCodeDto) {
    return axios.post(
      `${Environment.SERVICE_NOTIFICATION_URL}/validate-email-authcode`,
      body
    );
  }

  public async nsSendSMSAuthCode(body: SendSMSAuthCodeDto) {
    return axios.post(
      `${Environment.SERVICE_NOTIFICATION_URL}/send-sms-authcode`,
      body
    );
  }

  public async nsValidateSMSAuthCode(body: ValidateSMSAuthCodeDto) {
    return axios.post(
      `${Environment.SERVICE_NOTIFICATION_URL}/validate-sms-authcode`,
      body
    );
  }

  public async asRequestUserToken(body: RequestUserTokenDto) {
    return axios.post(
      `${Environment.SERVICE_API_AUTH_URL}/request-user-token`,
      body
    );
  }

  public async asVerifyUserToken(body: RequestUserTokenBodyDto) {
    const { data } = await axios.post(
      `${Environment.SERVICE_API_AUTH_URL}/validate-user-token`,
      body
    );
    return data;
  }
}
