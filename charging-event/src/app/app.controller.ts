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
import { PinoLogger, InjectPinoLogger } from "nestjs-pino";
import { ChargingEventService } from "../database/charging-event/charging-event.service";
import { ExternalService } from "../services/external/external.service";
import { AuthChargeSMSDto } from "./dtos/AuthChargeSMS.dto";
import { StartChargeDto } from "./dtos/StartCharge.dto";
import { ChargingIoTService } from "../services/charging-iot/charging-iot.service";
import { ChargingStatusDto } from "../services/charging-iot/dtos/ChargingStatus.dto";
import { ManageChargingDto } from "../services/charging-iot/dtos/ManageCharging.dto";
import { convert2StandardPhoneNumber } from "../utils/phone.util";
import Environment from "../config/env";

const transactionLock: Record<number, boolean> = {};

@Controller()
export class AppController {
  @InjectPinoLogger(AppController.name)
  private readonly logger: PinoLogger;

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
    @Request() req: IRequest,
    @Response() res: IResponse
  ) {
    try {
      const { data: user } = await this.externalService.umGetProfile(req.headers.authorization!);

      const chargingEvents = await this.chargingEventService.getLatestChargingEvents(user.phoneNumber);
      if (!chargingEvents || chargingEvents.length <= 0)
        return res.status(404).send({ message: "No active charging session" });
      
      const { data: chargingStatus } = await this.chargingIoTService.getChargingStatus({ eventId: chargingEvents[0].id, phoneNumber: user.phoneNumber, stationId: chargingEvents[0].stationId });
      if (chargingStatus.status === 1 && chargingStatus.sessionStatus === 'charging')
        return res.send(chargingEvents[0]);
      else 
        return res.status(404).send({ message: "No active charging session" });
      
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send({ message: "Failed to fetch active charging session." });
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
      const user = (await this.externalService.umGetProfile(String(request.headers['authorization']))).data;
      const phoneNumber = convert2StandardPhoneNumber(user.phoneNumber);
      if (!phoneNumber) {
        response.status(400).send({
          message: "Please enter 10 digit phone number - no dashes or spaces"
        });
        return;
      }
      const chargingEvent = await this.chargingEventService.saveChargingEvent({
        phoneNumber,
        stationId,
        notificationId: 0
      });
      const { data: connectivity } =
        await this.chargingIoTService.checkConnectivity({
          stationId: chargingEvent.stationId,
          phoneNumber,
          eventId: chargingEvent.id,
        });
      if (connectivity.status != 0) {
        const { data: result } = await this.chargingIoTService.manageCharging({
          eventId: chargingEvent.id,
          eventType: 'start'
        });
        if (result.status != 0) {
          chargingEvent.sessionStatus = "in_progress";
          await this.chargingEventService.saveChargingEvent(chargingEvent);
          response.status(200)
            .send({ message: "AuthCode valid", ...chargingEvent });
          return;
        } else {
          await this.chargingEventService.deleteChargingEvent(chargingEvent.id);
          response.status(500)
            .send({
              message: 'Unable to start charging. Please try again.'
            });
          return;
        }
      } else {
        await this.chargingEventService.deleteChargingEvent(chargingEvent.id);
        response
          .status(400)
          .send(
            { message: "NOTE: You must plug charger into car before pressing start." }
          );
        return;
      }
    } catch (err) {
      this.logger.error(err);
      response.status(500).send({
        message: "System Error... please try again or call 480-573-2001 for support. "
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
      const user = (
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
        if (connectivity.status != 0) {
          const { data: result } = await this.chargingIoTService.manageCharging({
            eventId: chargingEventId,
            eventType: 'start'
          });
          if (result.status != 0) {
            response.status(200)
              .send({ message: "AuthCode valid" });
          } else {
            response.status(500)
              .send({
                message: 'Unable to start charging. Please try again.'
              })
          }
        } else {
          response
            .status(400)
            .send(
              { message: "NOTE: You must plug charger into car before pressing start." }
            );
        }
      } else {
        response.status(404).send({ message: "ChargingEvent not found" });
      }
    } catch (err) {
      this.logger.error(err);
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
    let exception = false;
    try {
      let status;
      if (body.iotException) {
        status = {
          chargeStatusPercentage: 0,
          chargeDeliveredKwh: 0,
          chargeSpeedKwh: 0,
          chargeVehicleRequestedKwh: 0,
          rateActivekWh: 0,
          sessionTotalDuration: 0,
          status: 1,
          sessionStatus: 'iot_error',
          exceptionStatus: 'pending',
        }
      } else {
        status = (await this.chargingIoTService.getChargingStatus(body)).data;
      }
      status.PROMO1_FROM_DATE = Environment.PROMO1_FROM_DATE;
      status.PROMO1_TO_DATE = Environment.PROMO1_TO_DATE;
      const chargingEvent = await this.chargingEventService.getChargingEvent(
        body.eventId
      );
      if (!chargingEvent) {
        throw Error("ChargingEvent not found");
      }
      
      if (status.status != 0 && (status.chargeComplete != 0 || ["idle", "offline", "iot_error", "payment_error"].includes(status.sessionStatus))) {
        if (chargingEvent) {
          if (chargingEvent.sessionStatus && chargingEvent.sessionStatus !== 'in_progress') {
            this.logger.error("Duplicated charging %o", chargingEvent);
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

          const { data: chargingData } = await this.chargingIoTService.completeCharging({
            eventId: body.eventId
          });
          if (chargingData.status == 0) {
            exception = true;
            throw Error("Error: bad JSON status from CompleteCharge");
          }
          chargingEvent.totalCostDollars = Number(chargingData.sessionTotalCost) && Math.max(chargingData.sessionTotalCost, 0.5);
          if (status.chargeComplete != 0)
            chargingEvent.sessionStatus = "completed";
          else
            chargingEvent.sessionStatus = status.sessionStatus;
          await this.chargingEventService.saveChargingEvent(chargingEvent);

          try {
            if (!chargingEvent.paymentIntentId && chargingEvent.totalCostDollars && !transactionLock[chargingEvent.id]) {
              const today = new Date();
              let actualCost = chargingEvent.totalCostDollars;
              if (today >= Environment.PROMO1_FROM_DATE && today < Environment.PROMO1_TO_DATE) {
                actualCost = Math.min(actualCost, 1);
                status.promoted = true;
              }
              transactionLock[chargingEvent.id] = true;
              const { data: paymentIntent} = await this.externalService.psCompleteCharge({
                amount: actualCost,
              }, request.headers.authorization as string);
              chargingEvent.paymentIntentId = paymentIntent.id;
              await this.chargingEventService.saveChargingEvent(chargingEvent);
            }
          } catch(err) {
            this.logger.error(err, "Payment Error");
            status.error = 'Payment failed';
            chargingEvent.sessionStatus = status.sessionStatus = 'payment_error';
            chargingEvent.exceptionStatus = status.exceptionStatus = 'pending';
            transactionLock[chargingEvent.id] = false;
            await this.chargingEventService.saveChargingEvent(chargingEvent);
            response.send(status);
            return;
          }
        } else {
          exception = true;
          throw Error("ChargingEvent not found");
        }
      } else if (status.status == 0) {
        exception = true;
        throw Error("Error: bad JSON status from GetChargingStatus");
      }
      if (chargingEvent.sessionStatus && chargingEvent.sessionStatus !== 'in_progress') {
        status.sessionStatus = chargingEvent.sessionStatus;
        status.sessionTotalCost = chargingEvent.totalCostDollars;
      }
      response.send(status);
    } catch (err: any) {
      this.logger.error(err);
      response.status(500).send({ message: exception ? "System Error..please try again or call 480-573-2001 for support." : 'ChargingIoT exception occurred' });
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
        let { data: result } = await this.chargingIoTService.manageCharging(
          body
        );
        if (result.status == 1 && body.eventType === 'stop') {
          const { data: status } = await this.chargingIoTService.getChargingStatus({
            eventId: chargingEvent.id,
            phoneNumber: chargingEvent.phoneNumber,
            stationId: chargingEvent.stationId
          });
          try {
            if (chargingEvent.sessionStatus && chargingEvent.sessionStatus !== 'in_progress') {
              this.logger.error("Duplicated charging %o", chargingEvent);
              result.error = "";
              response.send(result);
              return;
            }
            const { data: chargingData } = await this.chargingIoTService.completeCharging({
              eventId: body.eventId
            });
            chargingEvent.totalCostDollars = Number(chargingData.sessionTotalCost) && Math.max(chargingData.sessionTotalCost, 0.5);
            if (!chargingEvent.paymentIntentId && chargingEvent.totalCostDollars && !transactionLock[chargingEvent.id]) {
              const today = new Date();
              let actualCost = chargingEvent.totalCostDollars;
              if (today >= Environment.PROMO1_FROM_DATE && today < Environment.PROMO1_TO_DATE) {
                actualCost = Math.min(actualCost, 1);
                status.promoted = true;
              }
              transactionLock[chargingEvent.id] = true;
              const { data: paymentIntent } = await this.externalService.psCompleteCharge({
                amount: actualCost,
              }, request.headers.authorization as string);
              chargingEvent.paymentIntentId = paymentIntent.id;
            }
            chargingEvent.sessionStatus = "stopped";
          } catch(err) {
            this.logger.error(err);
            transactionLock[chargingEvent.id] = false;
            chargingEvent.sessionStatus = 'payment_error';
            chargingEvent.exceptionStatus = 'pending';
            result.error = 'Payment failed';
          }
          chargingEvent.chargeStatusPercentage = status.chargeStatusPercentage;
          chargingEvent.chargeDeliveredKwh = status.chargeDeliveredKwh;
          chargingEvent.chargeSpeedKwh = status.chargeSpeedKwh;
          chargingEvent.chargeVehicleRequestedKwh =
            status.chargeVehicleRequestedKwh;
          chargingEvent.rateActivekWh = status.rateActivekWh;
          chargingEvent.totalChargeTime = status.sessionTotalDuration;
          await this.chargingEventService.saveChargingEvent(chargingEvent);
        }
        result = {
          ...result,
          ...chargingEvent
        };
        response.send(result);
      } else {
        throw Error("ChargingEvent not found");
      }
    } catch (err) {
      this.logger.error(err);
      response.status(400).send(err);
    }
  }

  @Get("transactions")
  @ApiOperation({ summary: "Get list of transactions" })
  @ApiBearerAuth()
  public async getTransactions(@Request() request: IRequest, @Response() response: IResponse) {
    const headers = request.headers;
    try {
      const { data } = await this.externalService.umGetProfile(headers.authorization as string);
      const { phoneNumber } = data;
      const transactions = await this.chargingEventService.getTransactions(phoneNumber);
      response.send(transactions);
    } catch(err) {
      response.sendStatus(401);
    }
  }

  @Get("healthz")
  public async healthz(@Response() res: IResponse) {
    return res.sendStatus(200);
  }
}
