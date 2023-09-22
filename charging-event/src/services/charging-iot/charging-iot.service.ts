import { Inject, Injectable } from "@nestjs/common";
import { CheckConnectivityDto } from "./dtos/CheckConnectivity.dto";
import { ChargingStatusDto } from "./dtos/ChargingStatus.dto";
import { ManageChargingDto } from "./dtos/ManageCharging.dto";
import axios, { AxiosResponse } from "axios";
import Environment from "../../config/env";
import { SimulatorService } from "../simulator/simulator.service";
import { CompleteChargingDto } from "./dtos/CompleteCharging.dto";
import { PinoLogger, InjectPinoLogger } from "nestjs-pino";

@Injectable()
export class ChargingIoTService {
  @Inject()
  private simulatorService: SimulatorService;

  @InjectPinoLogger(ChargingIoTService.name)
  private readonly logger: PinoLogger;

  public async checkConnectivity(body: CheckConnectivityDto) {
    const simulatorData = await this.simulatorService.checkConnectivity(body);
    if (simulatorData) {
      return { data: simulatorData };
    }
    return axios
      .get(
        `${Environment.SERVICE_CHARGING_IOT_CHECK_CON_URL}/check-connectivity?eventId=${body.eventId}&phoneNumber=${body.phoneNumber}&stationId=${body.stationId}`
      )
      .then(this.handleIotResponse);
  }

  public async getChargingStatus(body: ChargingStatusDto) {
    const simulatorData = await this.simulatorService.getChargingStatus(body);
    if (simulatorData) {
      return { data: simulatorData };
    }
    return axios
      .get(
        `${Environment.SERVICE_CHARGING_IOT_URL}/get-charging-status?eventId=${body.eventId}`
      )
      .then(this.handleIotResponse);
  }

  public async manageCharging(body: ManageChargingDto) {
    const simulatorData = await this.simulatorService.manageCharging(body);
    if (simulatorData) {
      return { data: simulatorData };
    }
    return axios
      .get(
        `${Environment.SERVICE_CHARGING_IOT_MANAGE_CHG_URL}/manage-charging?eventId=${body.eventId}&eventType=${body.eventType}`
      )
      .then(this.handleIotResponse)
      .catch((err) => {
        throw Error("Sorry, we're running into some issues. Please try again after sometime.");
      });
  }

  public async completeCharging(body: CompleteChargingDto) {
    const delay = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(1);
      }, 2000);
    });
    await delay;
    const simulatorData = await this.simulatorService.completeCharging(body);
    if (simulatorData) {
      return { data: simulatorData };
    }
    return axios
      .get(
        `${Environment.SERVICE_CHARGING_IOT_COMPLETE_CHG_URL}/complete-charge?eventId=${body.eventId}`
      )
      .then(this.handleIotResponse)
      .catch((err) => {
        throw Error("Sorry, we're running into some issues. Please try again after sometime.");
      });
  }

  private handleIotResponse(res: AxiosResponse<any, any>) {
    /*const { data } = res;
    this.logger.info("IOT service response: %o", res)

    if (data.status === 0)
      this.logger.error("IOT service response contained errored status: %o", data);
    else if (JSON.stringify(data) === "{}" || !data)
      this.logger.error("IOT service returned bad data %o", data)
    */
    return res;
  }
}
