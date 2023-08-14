import { Inject, Injectable } from "@nestjs/common";
import { CheckConnectivityDto } from "./dtos/CheckConnectivity.dto";
import { ChargingStatusDto } from "./dtos/ChargingStatus.dto";
import { ManageChargingDto } from "./dtos/ManageCharging.dto";
import axios from "axios";
import Environment from "../../config/env";
import { getGlobalChargingStatus, setGlobalChargingStatus } from "../../utils/charging.util";
import { SimulatorService } from "../simulator/simulator.service";

@Injectable()
export class ChargingIoTService {
  @Inject()
  private simulatorService: SimulatorService;

  public async checkConnectivity(body: CheckConnectivityDto) {
    const simulatorData = await this.simulatorService.checkConnectivity(body);
    if (simulatorData) {
      return { data: simulatorData };
    }
    return axios.get(
      `${Environment.SERVICE_CHARGING_IOT_CHECK_CON_URL}/check-connectivity?eventId=${body.eventId}&phoneNumber=${body.phoneNumber}&stationId=${body.stationId}`
    );
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
      .then((res) => {
        res.data.eventStatus = getGlobalChargingStatus(body.eventId);
        return res;
      })
      .catch((err) => {
        throw err;
      });
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
      .then((res) => {
        if (res.data.status) {
          setGlobalChargingStatus(body.eventId, body.eventType);
        }
        return res;
      })
      .catch((err) => {
        throw Error("Sorry, we're runnig into some issus. Please try again after sometime.");
      });
  }
}
