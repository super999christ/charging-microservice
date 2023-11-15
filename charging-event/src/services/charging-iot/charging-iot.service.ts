import { Inject, Injectable } from "@nestjs/common";
import { CheckConnectivityDto } from "./dtos/CheckConnectivity.dto";
import { ManageChargingDto } from "./dtos/ManageCharging.dto";
import axios, { AxiosResponse } from "axios";
import Environment from "../../config/env";
import { SimulatorService } from "../simulator/simulator.service";
import { PinoLogger, InjectPinoLogger } from "nestjs-pino";
import axiosRetry from 'axios-retry';

@Injectable()
export class ChargingIoTService {
  @Inject()
  private simulatorService: SimulatorService;

  @InjectPinoLogger(ChargingIoTService.name)
  private readonly logger: PinoLogger;

  public async checkConnectivity(body: CheckConnectivityDto) {
    const simulatorData = await this.simulatorService.checkConnectivity();
    if (simulatorData) {
      return { data: simulatorData };
    }
    return axios
      .get(
        `${Environment.SERVICE_CHARGING_IOT_CHECK_CON_URL}/check-connectivity?eventId=${body.eventId}&phoneNumber=${body.phoneNumber}&stationId=${body.stationId}`
      )
      .then((res) => this.handleIotResponse(res));
  }

  public async getChargingStatus(eventId: number) {
    const simulatorData = await this.simulatorService.getChargingStatus();
    if (simulatorData) {
      return { data: simulatorData };
    }
    return axios
      .get(
        `${Environment.SERVICE_CHARGING_IOT_URL}/get-charging-status?eventId=${eventId}`
      )
      .then((res) => this.handleIotResponse(res));
  }

  public async manageCharging(body: ManageChargingDto): Promise<any> {
    const simulatorData = await this.simulatorService.manageCharging();
    if (simulatorData) {
      return { data: simulatorData };
    }
    return axios
      .get(
        `${Environment.SERVICE_CHARGING_IOT_MANAGE_CHG_URL}/manage-charging?eventId=${body.eventId}&eventType=${body.eventType}`
      )
      .then((res) => this.handleIotResponse(res))
      .catch((err) => this.handleIoTError(err));
  }

  public async completeCharging(eventId: number) {
    const simulatorData = await this.simulatorService.completeCharging();
    if (simulatorData) {
      return { data: simulatorData };
    }
    const IOT_RETRY_COUNT = Environment.IOT_RETRY_COUNT;
    const IOT_RETRY_DELAY = Environment.IOT_RETRY_DELAY;

    let retryCount: number = 0;
    let retryFlag: boolean = false;
    let res = { data: { status: 0 } };

    while (retryCount < IOT_RETRY_COUNT) {
      try {
        const res = await axios
          .get(
            `${Environment.SERVICE_CHARGING_IOT_COMPLETE_CHG_URL}/complete-charge?eventId=${eventId}`
          );
        this.handleIotResponse(res);
        retryFlag = false;
      } catch (err) {
        this.handleIoTError(err);
        retryFlag = true;
      }
      if (retryFlag) {
        retryCount++;
        const clockWaitPromise = new Promise(resolve => {
          setTimeout(() => {
            resolve(0);
          }, IOT_RETRY_DELAY);
        });
        await clockWaitPromise;
      } else {
        break;
      }
    }
    if (retryFlag) {
      throw Error("IOT CompleteCharge failed");
    }
    return res
  }

  public handleIotResponse(res: AxiosResponse<any, any>) {
    const { data } = res;

    this.logger.info("IOT service response: %o", res);

    if (data.status === 0)
      this.logger.error(
        "IOT service response contained errored status: %o",
        data
      );
    else if (JSON.stringify(data) === "{}" || !data)
      this.logger.error("IOT service returned bad data %o", data);

    return res;
  }

  public handleIoTError(err: any) {
    this.logger.error("IOT service error: ", err);
  }
}
