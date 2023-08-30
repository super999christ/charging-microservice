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

  @Get("active-session")
  @ApiOperation({ summary: "Finds the latest active charging session" })
  @ApiBearerAuth()
  public async activeSession(
    @Request() request: IRequest,
    @Response() response: IResponse
  ) {
    try {
      const user = (
        await this.externalService.umGetProfile(
          String(request.headers["authorization"])
        )
      ).data;
      const chargingEvents =
        await this.chargingEventService.getLatestChargingEvents(
          user.phoneNumber
        );
      if (!chargingEvents.length || chargingEvents[0].sessionStatus) {
        throw Error("No active charging session");
      }
      const { data: chargingStatus } =
        await this.chargingIoTService.getChargingStatus({
          eventId: chargingEvents[0].id,
          phoneNumber: chargingEvents[0].phoneNumber,
          stationId: chargingEvents[0].stationId,
        });
      if (chargingStatus.status && chargingStatus.sessionStatus === "charging")
        response.send(chargingEvents[0]);
      else {
        throw Error("No active charging session");
      }
    } catch (error) {
      console.error("@Error: ", error);
      response.status(404).send({
        message: "No active charging session",
      });
    }
  }

  @Post("start-charge")
  @ApiOperation({ summary: "Start Charging" })
  @ApiBearerAuth()
  public async startCharge(
    @Body() body: StartChargeDto,
    @Request() request: IRequest,
    @Response() response: IResponse
  ) {
    let { stationId } = body;
    try {
      const user = (
        await this.externalService.umGetProfile(
          String(request.headers["authorization"])
        )
      ).data;
      const phoneNumber = convert2StandardPhoneNumber(user.phoneNumber);
      if (!phoneNumber) {
        response.status(400).send({
          message: "Please enter 10 digit phone number - no dashes or spaces",
        });
        return;
      }
      const chargingEvent = await this.chargingEventService.saveChargingEvent({
        phoneNumber,
        stationId,
        notificationId: 0,
      });
      const { data: connectivity } =
        await this.chargingIoTService.checkConnectivity({
          stationId: chargingEvent.stationId,
          phoneNumber,
          eventId: chargingEvent.id,
        });
      if (connectivity.status) {
        const { data } = await this.externalService.asRequestUserToken({
          userId: user.id,
        });
        const { data: result } = await this.chargingIoTService.manageCharging({
          eventId: chargingEvent.id,
          eventType: "start",
        });
        if (result.status) {
          response.status(200).send({
            message: "AuthCode valid",
            token: data.token,
            ...chargingEvent,
          });
          return;
        } else {
          response.status(500).send({
            message: "Unable to start charging please try back after some time",
          });
          return;
        }
      } else {
        await this.chargingEventService.deleteChargingEvent(chargingEvent.id);
        response.status(400).send({
          message:
            "NOTE: You must plug charger into car before pressing start.",
        });
        return;
      }
    } catch (error) {
      console.error("@Error: ", error);
      response.status(401).send({
        message: "Phone No. not registed",
      });
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
              "NOTE: You must plug charger into car before pressing start.",
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
    @Request() request: IRequest,
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
    @Request() request: IRequest,
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
      const { data: userPhone } = await this.externalService.umValidatePhone({
        phoneNumber: chargingEvent.phoneNumber,
      });
      const { data: auth } = await this.externalService.asRequestUserToken({
        userId: userPhone.user.id,
      });
      status.token = auth.token;
      if (
        status.status &&
        (status.chargeComplete ||
          ["idle", "offline"].includes(status.sessionStatus))
      ) {
        if (chargingEvent) {
          if (chargingEvent.sessionStatus) {
            console.error("@Error: duplicated charging ", chargingEvent);
            status.sessionStatus = chargingEvent.sessionStatus;
            status.sessionTotalCost = chargingEvent.totalCostDollars;
            response.send(status);
            return;
          }
          chargingEvent.chargeStatusPercentage = status.chargeStatusPercentage;
          chargingEvent.chargeDeliveredKwh = status.chargeDeliveredKwh;
          chargingEvent.chargeSpeedKwh = status.chargeSpeedKwh;
          chargingEvent.chargeVehicleRequestedKwh =
            status.chargeVehicleRequestedKwh;
          chargingEvent.rateActivekWh = status.rateActivekWh;
          chargingEvent.totalChargeTime = status.sessionTotalDuration;
          chargingEvent.sessionStatus = status.sessionStatus;

          const { data: chargingData } =
            await this.chargingIoTService.completeCharging({
              eventId: body.eventId,
            });
          chargingEvent.totalCostDollars =
            chargingData.sessionTotalCost &&
            Math.max(chargingData.sessionTotalCost, 0.5);
          if (status.chargeComplete) chargingEvent.sessionStatus = "completed";
          else chargingEvent.sessionStatus = status.sessionStatus;
          await this.chargingEventService.saveChargingEvent(chargingEvent);

          try {
            if (chargingEvent.totalCostDollars) {
              await this.externalService.psCompleteCharge(
                {
                  amount: chargingEvent.totalCostDollars,
                },
                request.headers.authorization as string
              );
            }
          } catch (err) {
            console.error(
              "@PaymentError: ",
              chargingEvent.totalCostDollars,
              userPhone.user,
              err
            );
            status.error = "Payment failed";
            response.send(status);
            return;
          }
        } else {
          throw Error("ChargingEvent not found");
        }
      }
      if (chargingEvent.sessionStatus) {
        status.sessionStatus = chargingEvent.sessionStatus;
        status.sessionTotalCost = chargingEvent.totalCostDollars;
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
    @Request() request: IRequest,
    @Response() response: IResponse
  ) {
    try {
      const chargingEvent = await this.chargingEventService.getChargingEvent(
        body.eventId
      );
      if (chargingEvent) {
        await this.externalService.umValidatePhone({
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
            if (chargingEvent.sessionStatus) {
              console.error("@Error: duplicated charging ", chargingEvent);
              result.error = "";
              response.send(result);
              return;
            }
            const { data: chargingData } =
              await this.chargingIoTService.completeCharging({
                eventId: body.eventId,
              });
            chargingEvent.totalCostDollars =
              chargingData.sessionTotalCost &&
              Math.max(chargingData.sessionTotalCost, 0.5);
            if (chargingEvent.totalCostDollars) {
              await this.externalService.psCompleteCharge(
                {
                  amount: chargingEvent.totalCostDollars,
                },
                request.headers.authorization as string
              );
            }
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
          chargingEvent.totalChargeTime = status.sessionTotalDuration;
          chargingEvent.sessionStatus = "stopped";
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
