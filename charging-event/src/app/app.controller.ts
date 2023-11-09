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

      const chargingEvents = await this.chargingEventService.getLatestChargingEvents(user.id);
      if (!chargingEvents || chargingEvents.length <= 0)
        return res.status(404).send({ message: "No active charging session" });

      const { data: chargingStatus } = await this.chargingIoTService.getChargingStatus({ eventId: chargingEvents[0].id });
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
        userId: user.id,
        stationId
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
      const user = (
        await this.externalService.umGetUserById(chargingEvent.userId)
      ).data;

      status.billingPlanId = user.billingPlanId;

      if (status.status != 0 && (status.chargeComplete != 0 || ["idle", "offline", "iot_error", "payment_error"].includes(status.sessionStatus))) {
        if (chargingEvent) {
          if (chargingEvent.sessionStatus && chargingEvent.sessionStatus !== 'in_progress') {
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

          let chargingData: any = {};
          try {
            chargingData = (await this.chargingIoTService.completeCharging({
              eventId: body.eventId
            })).data;
            if (chargingData.status == 0) {
              exception = true;
              throw Error("Error: bad JSON status from CompleteCharge");
            }
          } catch (error) {
            this.logger.error("IOT CompleteCharge error: ", error);
            chargingEvent.sessionStatus = status.sessionStatus = 'iot_error';
            chargingEvent.exceptionStatus = status.exceptionStatus = 'pending';
            transactionLock[chargingEvent.id] = false;
            await this.chargingEventService.saveChargingEvent(chargingEvent);
            response.send(status);
            return;
          }
          chargingEvent.totalCostDollars = Number(chargingData.sessionTotalCost) && Math.max(chargingData.sessionTotalCost, 0.5);
          if (status.chargeComplete != 0)
            chargingEvent.sessionStatus = "completed";
          else
            chargingEvent.sessionStatus = status.sessionStatus;
          await this.chargingEventService.saveChargingEvent(chargingEvent);

          try {
            if (!chargingEvent.paymentIntentId && chargingEvent.totalCostDollars && !transactionLock[chargingEvent.id]) {
              const timeZone = 'America/Los_Angeles';
              const today = new Date().toLocaleString('sv', { timeZone });
              const PROMO1_FROM_DATE = Environment.PROMO1_FROM_DATE.toLocaleString('sv', { timeZone });
              const PROMO1_TO_DATE = Environment.PROMO1_TO_DATE.toLocaleString('sv', { timeZone });

              let actualCost = chargingEvent.totalCostDollars;
              this.logger.info(`Is charging event time '${today}' within promotion time range '${PROMO1_FROM_DATE}' to '${PROMO1_TO_DATE}': ${PROMO1_FROM_DATE <= today && today < PROMO1_TO_DATE}`);
              if (PROMO1_FROM_DATE <= today && today < PROMO1_TO_DATE) {
                actualCost = Math.min(actualCost, 1);
                status.promoted = true;
              }
              transactionLock[chargingEvent.id] = true;
              if (user.billingPlanId != 2) {   // <> not subscription
                const { data: paymentIntent } = await this.externalService.psCompleteCharge({
                  amount: actualCost,
                  idempotencyKey: `transaction_charge_${chargingEvent.id}`
                }, request.headers.authorization as string);
                chargingEvent.paymentIntentId = paymentIntent.id;
              } else { // is transaction
                if (chargingEvent.sessionStatus === "completed")
                  chargingEvent.sessionStatus = "completed_sub";
              }
              await this.chargingEventService.saveChargingEvent(chargingEvent);
            }
          } catch (err) {
            this.logger.error(err, "Payment Error");
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
        const user = (
          await this.externalService.umGetUserById(chargingEvent.userId)
        ).data;
        let { data: result } = await this.chargingIoTService.manageCharging(
          body
        );
        if (result.status == 1 && body.eventType === 'stop') {
          let status: any = {}, chargingData: any = {};
          try {
            status = (await this.chargingIoTService.getChargingStatus({
              eventId: chargingEvent.id
            })).data;
            if (chargingEvent.sessionStatus && chargingEvent.sessionStatus !== 'in_progress') {
              result.error = "";
              response.send(result);
              return;
            }
            chargingData = (await this.chargingIoTService.completeCharging({
              eventId: body.eventId
            })).data;
          } catch (error) {
            this.logger.error(error);
            transactionLock[chargingEvent.id] = false;
            chargingEvent.sessionStatus = 'iot_error';
            chargingEvent.exceptionStatus = 'pending';
            await this.chargingEventService.saveChargingEvent(chargingEvent);
            result = {
              ...result,
              ...chargingEvent
            };
            response.send(result);
            return;
          }
          try {
            chargingEvent.totalCostDollars = Number(chargingData.sessionTotalCost) && Math.max(chargingData.sessionTotalCost, 0.5);
            if (!chargingEvent.paymentIntentId && chargingEvent.totalCostDollars && !transactionLock[chargingEvent.id]) {
              const timeZone = 'America/Los_Angeles';
              const today = new Date().toLocaleString('sv', { timeZone });
              const PROMO1_FROM_DATE = Environment.PROMO1_FROM_DATE.toLocaleString('sv', { timeZone });
              const PROMO1_TO_DATE = Environment.PROMO1_TO_DATE.toLocaleString('sv', { timeZone });

              let actualCost = chargingEvent.totalCostDollars;
              this.logger.info(`Is charging event time '${today}' within promotion time range '${PROMO1_FROM_DATE}' to '${PROMO1_TO_DATE}': ${PROMO1_FROM_DATE <= today && today < PROMO1_TO_DATE}`);
              if (PROMO1_FROM_DATE <= today && today < PROMO1_TO_DATE) {
                actualCost = Math.min(actualCost, 1);
                result.promoted = true;
              }
              transactionLock[chargingEvent.id] = true;
              if (user.billingPlanId != 2) {    // <> not subscription
                const { data: paymentIntent } = await this.externalService.psCompleteCharge({
                  amount: actualCost,
                  idempotencyKey: `transaction_charge_${chargingEvent.id}`
                }, request.headers.authorization as string);
                chargingEvent.paymentIntentId = paymentIntent.id;
                chargingEvent.sessionStatus = "stopped";
              } else {    // is transaction
                chargingEvent.sessionStatus = "stopped_sub";
              }
            }
          } catch (err) {
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
      const { data: user } = await this.externalService.umGetProfile(headers.authorization as string);
      const transactions = await this.chargingEventService.getTransactions(user.id);
      response.send(transactions);
    } catch (err) {
      response.sendStatus(401);
    }
  }

  @Get("healthz")
  public async healthz(@Response() res: IResponse) {
    return res.sendStatus(200);
  }
}
