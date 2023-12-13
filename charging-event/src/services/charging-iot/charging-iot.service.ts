import { Inject, Injectable } from "@nestjs/common";
import { CheckConnectivityDto } from "./dtos/CheckConnectivity.dto";
import { ManageChargingDto } from "./dtos/ManageCharging.dto";
import axios, { AxiosResponse } from "axios";
import Environment from "../../config/env";
import { SimulatorService } from "../simulator/simulator.service";
import { PinoLogger, InjectPinoLogger } from "nestjs-pino";

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
    const apiFn = () => {
      return axios
        .get(
          `${Environment.SERVICE_CHARGING_IOT_CHECK_CON_URL}/check-connectivity?eventId=${body.eventId}&phoneNumber=${body.phoneNumber}&stationId=${body.stationId}`
        )
    };
    return this.triggerIOTMethod(apiFn, "CheckConnectivity", Environment.IOT_CHECK_RETRY_COUNT,  Environment.IOT_CHECK_RETRY_DELAY);
  }

  public async triggerIOTMethod(apiFn: () => Promise<any>, apiName: string, retryCount: number, retryDelay: number) {

    let count: number = 0;
    let retryFlag: boolean = false;
    let res = { data: { status: 0 } };

    this.logger.info(`apiName: ${apiName}, retryCount: ${retryCount}, retryDelay: ${retryDelay}`);

    while (count < retryCount) {
      try {        
        res = await apiFn();
        if (res.data.status != 1) {
          // Retry for App Errors
          throw Error(`App Error`);
        } else {
          retryFlag = false;
        }
      } catch (err) {
        retryFlag = true;

        const excp_str = `IOT ${apiName}, retryCount ${retryCount}, retry ${count}, Status ${res.data.status}, response ${JSON.stringify(res)}, catch_err =  ${err}`;
        this.logger.error(excp_str);
      }
      if (retryFlag) {
        count++;
        const clockWaitPromise = new Promise(resolve => {
          setTimeout(() => {
            resolve(0);
          }, retryCount);
        });
        await clockWaitPromise;
      } else {
        break;
      }
    }
    if (retryFlag) {
      throw Error(`IOT ${apiName} failed`);
    }
    return res
  }

  public async getChargingStatus(eventId: number) {
    const simulatorData = await this.simulatorService.getChargingStatus();
    if (simulatorData) {
      return { data: simulatorData };
    }
    const apiFn = () => {
      return axios
        .get(
          `${Environment.SERVICE_CHARGING_IOT_URL}/get-charging-status?eventId=${eventId}`
        )  
    };
    return this.triggerIOTMethod(apiFn, "ChargingStatus", Environment.IOT_RETRY_COUNT, Environment.IOT_RETRY_DELAY);
  }

  public async manageCharging(body: ManageChargingDto): Promise<any> {
    const simulatorData = await this.simulatorService.manageCharging();
    if (simulatorData) {
      return { data: simulatorData };
    }
    const apiFn = () => {
      return axios
        .get(
          `${Environment.SERVICE_CHARGING_IOT_MANAGE_CHG_URL}/manage-charging?eventId=${body.eventId}&eventType=${body.eventType}`
        );
    }
    return this.triggerIOTMethod(apiFn, "ManageCharging", Environment.IOT_RETRY_COUNT, Environment.IOT_RETRY_DELAY);
  }

  public async completeCharging(eventId: number) {
    const simulatorData = await this.simulatorService.completeCharging();
    if (simulatorData) {
      return { data: simulatorData };
    }
    const apiFn = () => {
      return axios
        .get(
          `${Environment.SERVICE_CHARGING_IOT_COMPLETE_CHG_URL}/complete-charge?eventId=${eventId}`
        );
    }
    return this.triggerIOTMethod(apiFn, "CompleteCharging", Environment.IOT_RETRY_COUNT, Environment.IOT_RETRY_DELAY);
  }

  public handleIotResponse(res: any) {
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

  public handleIoTError(err: any): never {
    this.logger.error(err);

    throw Error(
      "Sorry, we're running into some issues. Please try again after sometime."
    );
  }
}
