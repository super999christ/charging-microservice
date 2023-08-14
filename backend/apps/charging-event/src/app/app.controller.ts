import {
  Body,
  Controller,
  Inject,
  Post,
  Response,
  Request,
  Get,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Response as IResponse, Request as IRequest } from "express";
import { ChargingEventService } from "../database/charging-event/charging-event.service";
import { ExternalService } from "../services/external/external.service";
import { AuthChargeSMSDto } from "./dtos/AuthChargeSMS.dto";
import { StartChargeDto } from "./dtos/StartCharge.dto";
import { ChargingIoTService } from "../services/charging-iot/charging-iot.service";
import { ChargingStatusDto } from "../services/charging-iot/dtos/ChargingStatus.dto";
import { ManageChargingDto } from "../services/charging-iot/dtos/ManageCharging.dto";
import { convert2StandardPhoneNumber } from "../utils/phone.util";

@Controller()
export class AppController {
  @Inject()
  private chargingEventService: ChargingEventService;

  @Inject()
  private externalService: ExternalService;

  @Inject()
  private chargingIoTService: ChargingIoTService;

  @Post("start-charge")
  @ApiOperation({ summary: "Start Charging" })
  @ApiBearerAuth()
  public async startCharge(
    @Body() body: StartChargeDto,
    @Response() response: IResponse
  ) {
    let { phoneNumber, stationId } = body;
    try {
      phoneNumber = convert2StandardPhoneNumber(phoneNumber);
      if (!phoneNumber) {
        response
          .status(400)
          .send("Please enter 10 digit phone number - no dashes or spaces");
        return;
      }
      const userPhone = (
        await this.externalService.umValidatePhone({ phoneNumber })
      ).data;
      // Saves a new event in the DB
      const { data: notification } =
        await this.externalService.nsSendSMSAuthCode({ phoneNumber });
      const chargingEvent = await this.chargingEventService.saveChargingEvent({
        phoneNumber,
        stationId,
        notificationId: notification.id,
      });
      response.status(200).send(chargingEvent);
    } catch (error) {
      console.error("@Error: ", error);
      response.status(401).send("Phone No. not registed");
    }
  }

  @Post("auth-charge-sms")
  @ApiOperation({ summary: "Validates AuthCode and PhoneNumber" })
  @ApiBearerAuth()
  public async authChargeSMS(
    @Body() body: AuthChargeSMSDto,
    @Response() response: IResponse
  ) {
    let { notificationId, phoneNumber, authCode, chargingEventId } = body;
    try {
      phoneNumber = convert2StandardPhoneNumber(phoneNumber);
      const userPhone = (
        await this.externalService.umValidatePhone({ phoneNumber })
      ).data;
      const authValid = (
        await this.externalService.nsValidateSMSAuthCode({
          notificationId,
          phoneNumber,
          authCode,
        })
      ).data;
      const chargingEvent = await this.chargingEventService.getChargingEvent(
        chargingEventId
      );
      if (chargingEvent) {
        chargingEvent.smsAuthValid = true;
        const { data: connectivity } =
          await this.chargingIoTService.checkConnectivity({
            stationId: chargingEvent.stationId,
            phoneNumber,
            eventId: chargingEvent.id,
          });
        if (connectivity.status) {
          const { data } = await this.externalService.asRequestUserToken({
            userId: userPhone.user.id,
          });
          const { data: result } = await this.chargingIoTService.manageCharging(
            {
              eventId: chargingEventId,
              eventType: "start",
            }
          );
          if (result.status) {
            response
              .status(200)
              .send({ message: "AuthCode valid", token: data.token });
          } else {
            response.status(500).send({
              message:
                "Unable to start charging please try back after some time",
            });
          }
        } else {
          response.status(400).send({
            message:
              "Charging Session not available please try back after some time",
          });
        }
      } else {
        response.status(404).send({ message: "ChargingEvent not found" });
      }
    } catch (error) {
      console.error("@Error: ", error);
      response.status(401).send({ message: "AuthCode is invalid" });
    }
  }

  @Get("check-event-availability")
  @ApiOperation({ summary: "Check status of old charging events" })
  @ApiBearerAuth()
  public async checkEventAvailability(
    @Query("eventId") eventId: number,
    @Response() response: IResponse
  ) {
    const chargingEvent = await this.chargingEventService.getChargingEvent(
      eventId
    );
    if (chargingEvent) {
      response.send({ status: chargingEvent.totalCostDollars ? 0 : 1 });
    } else {
      response.send({ status: 0 });
    }
  }

  @Post("charging-status")
  @ApiOperation({ summary: "Get charging status" })
  @ApiBearerAuth()
  public async chargingStatus(
    @Body() body: ChargingStatusDto,
    @Response() response: IResponse
  ) {
    try {
      const { data: status } = await this.chargingIoTService.getChargingStatus(
        body
      );
      const chargingEvent = await this.chargingEventService.getChargingEvent(
        body.eventId
      );
      if (!chargingEvent) {
        throw Error("ChargingEvent not found");
      }
      const { data: userPhone } =
        await this.externalService.umValidatePhone({
          phoneNumber: chargingEvent.phoneNumber,
        });
      const { data: auth } = await this.externalService.asRequestUserToken(userPhone.user.id);
      status.token = auth.token;
      if (status.status && status.chargeComplete) {
        if (chargingEvent) {
          if (chargingEvent.totalCostDollars) {
            console.error("@Error: duplicated charging ", chargingEvent);
            status.error = "";
            response.send(status);
            return;
          }
          chargingEvent.chargeStatusPercentage = status.chargeStatusPercentage;
          chargingEvent.chargeDeliveredKwh = status.chargeDeliveredKwh;
          chargingEvent.chargeSpeedKwh = status.chargeSpeedKwh;
          chargingEvent.chargeVehicleRequestedKwh =
            status.chargeVehicleRequestedKwh;
          chargingEvent.rateActivekWh = status.rateActivekWh;
          chargingEvent.totalCostDollars = Math.max(
            status.sessionTotalCost,
            0.5
          );
          chargingEvent.totalChargeTime = status.sessionTotalDuration;
          await this.chargingEventService.saveChargingEvent(chargingEvent);

          try {
            await this.externalService.psCompleteCharge({
              pmId: userPhone.user.stripePmId,
              cusId: userPhone.user.stripeCustomerId,
              amount: chargingEvent.totalCostDollars,
            });
          } catch (err) {
            console.error("@Error: ", err);
            status.error = "Payment failed";
          }
        } else {
          throw Error("ChargingEvent not found");
        }
      }
      response.send(status);
    } catch (err) {
      console.error("@Error: ", err);
      response.status(400).send(err);
    }
  }

  @Post("manage-charging")
  @ApiOperation({ summary: "Manage charging (start, pause, resume, stop)" })
  @ApiBearerAuth()
  public async manageCharging(
    @Body() body: ManageChargingDto,
    @Response() response: IResponse
  ) {
    try {
      const chargingEvent = await this.chargingEventService.getChargingEvent(
        body.eventId
      );
      if (chargingEvent) {
        const { data: userPhone } = await this.externalService.umValidatePhone({
          phoneNumber: chargingEvent.phoneNumber,
        });
        const { data: result } = await this.chargingIoTService.manageCharging(
          body
        );
        if (result.status && body.eventType === "stop") {
          const { data: status } =
            await this.chargingIoTService.getChargingStatus({
              eventId: chargingEvent.id,
              phoneNumber: chargingEvent.phoneNumber,
              stationId: chargingEvent.stationId,
            });
          try {
            if (chargingEvent.totalCostDollars) {
              console.error("@Error: duplicated charging ", chargingEvent);
              result.error = "";
              response.send(result);
              return;
            }
            console.log("@User: ", userPhone, status);
            await this.externalService.psCompleteCharge({
              pmId: userPhone.user.stripePmId,
              cusId: userPhone.user.stripeCustomerId,
              amount: status.sessionTotalCost,
            });
          } catch (err) {
            console.error("@Error: ", err);
            result.error = "Payment failed";
          }
          chargingEvent.chargeStatusPercentage = status.chargeStatusPercentage;
          chargingEvent.chargeDeliveredKwh = status.chargeDeliveredKwh;
          chargingEvent.chargeSpeedKwh = status.chargeSpeedKwh;
          chargingEvent.chargeVehicleRequestedKwh =
            status.chargeVehicleRequestedKwh;
          chargingEvent.rateActivekWh = status.rateActivekWh;
          chargingEvent.totalCostDollars = Math.max(
            status.sessionTotalCost,
            0.5
          );
          chargingEvent.totalChargeTime = status.sessionTotalDuration;
          await this.chargingEventService.saveChargingEvent(chargingEvent);
        }
        response.send(result);
      } else {
        throw Error("ChargingEvent not found");
      }
    } catch (err) {
      console.error("@Error: ", err);
      response.status(400).send(err);
    }
  }

  @Get("transactions")
  @ApiOperation({ summary: "Get list of transactions" })
  @ApiBearerAuth()
  public async getTransactions(
    @Request() request: IRequest,
    @Response() response: IResponse
  ) {
    const headers = request.headers;
    try {
      const { data } = await this.externalService.umGetProfile(
        headers.authorization as string
      );
      const { phoneNumber } = data;
      const transactions = await this.chargingEventService.getTransactions(
        phoneNumber
      );
      response.send(transactions);
    } catch (err) {
      response.sendStatus(401);
    }
  }

  @Get("healthz")
  public async healthz(@Response() response: IResponse) {
    return response.sendStatus(200);
  }
}
