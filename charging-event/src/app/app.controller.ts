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

      const { data: chargingStatus } = await this.chargingIoTService.getChargingStatus(chargingEvents[0].id);
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
    let startStatus = {
      statusType: 'none',
      statusMessage: 'none'
    };
    let user, phoneNumber;
    try {
      user = (await this.externalService.umGetProfile(String(request.headers['authorization']))).data;
      phoneNumber = convert2StandardPhoneNumber(user.phoneNumber);
      if (!phoneNumber) {
        throw Error("App Error in umGetProfile: User phone number validation");
      }
    } catch (err) {
      this.logger.error("User phone number validation failed: ", err);
      startStatus.statusType = "error";
      startStatus.statusMessage = "Login phone number validation failed. Please re-login and try again.";
      response.send(startStatus);
      return;
    }
    // Create DB Event
    const chargingEvent = await this.chargingEventService.saveChargingEvent({
      userId: user.id,
      stationId
    });
    try {
      // Check connectivity
      const { data: connectivity } =
        await this.chargingIoTService.checkConnectivity({
          stationId: chargingEvent.stationId,
          phoneNumber,
          eventId: chargingEvent.id,
        });
      if (connectivity.status != 1) {
        throw Error("App Error in IOT CheckConnectivity returned Status: " + connectivity.status);
      }
    } catch (err) {
      this.logger.error("System Error in IOT CheckConnectivity");
      this.logger.error(err);
      startStatus.statusType = "error";
      startStatus.statusMessage = "Charging connection issue, please re-try plugging in or call 480-573-2001 for support.";
      await this.chargingEventService.deleteChargingEvent(chargingEvent.id);
      response.send(startStatus);
      return;
    }
    try {
      // Start charge
      const { data: result } = await this.chargingIoTService.manageCharging({
        eventId: chargingEvent.id,
        eventType: 'start'
      });
      if (result.status != 1) {
        throw Error("App Error in IOT ManageCharging StartCharge, returned Status: " + result.status);
      }
    } catch (err) {
      this.logger.error("System Error in IOT ManageCharging StartCharge: ", err);
      startStatus.statusType = "error";
      startStatus.statusMessage = "Charging start issue, please re-try plugging in or call 480-573-2001 for support.";
      response.send(startStatus);
      return;
    }
    // Successfully started the charge
    chargingEvent.sessionStatus  ="in_progress";
    await this.chargingEventService.saveChargingEvent(chargingEvent);
    startStatus.statusType = "none";
    startStatus.statusMessage = "none";
    response.send(startStatus);
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
    const { eventId, isStopped } = body;
    let chargingStatus: any = {
      statusType: 'none',
      statusMessage: 'none'
    };
    // Set the server side lock
    if (transactionLock[eventId]) {
      this.logger.info("Transaction lock busy for event: ", eventId);
      response.send(chargingStatus);
      return;
    }
    transactionLock[eventId] = true;

    let chargingEvent;
    try {
      // Lookup charging event and user billing plan
      chargingEvent = await this.chargingEventService.getChargingEvent(eventId);
      if (!chargingEvent) {
        throw Error("ChargingEvent not found");
      }
      const user = (
        await this.externalService.umGetUserById(chargingEvent.userId)
      ).data;
      if (!user) {
        throw Error("ChargingEvent User not found");
      }

      if (isStopped) {
        let result;
        try {
          result = (await this.chargingIoTService.manageCharging({
            eventId,
            eventType: 'stop'
          })).data;
          if (result.status != 1) {
            throw Error("IOT StopCharging failed with status=0");
          }
        } catch (error) {
          this.logger.error("Stop IOT error: ", error);
          // return an App error to the frontend and set for offline processing
          chargingStatus.statusType = "success";
          chargingStatus.statusMessage = this.getSuccessStopMessage(user.billingPlanId);
          chargingEvent.sessionStatus = "stop_iot_error";
          chargingEvent.exceptionStatus = "pending";
          await this.chargingEventService.saveChargingEvent(chargingEvent);
          transactionLock[eventId] = false;

          chargingStatus.sessionStatus = chargingEvent.sessionStatus;
          response.send(chargingStatus);
          return;
        }
      }

      try {
        chargingStatus = (await this.chargingIoTService.getChargingStatus(eventId)).data;
        if (chargingStatus.status != 1) {
          throw Error("IOT ChargingStatus failed with status=0");
        }
        chargingStatus.statusType = 'none';
        chargingStatus.statusMessage = 'none';
      } catch (error) {
        this.logger.error("IOT Error: Get Charging Status failed ", error);
        // return an App error to the frontend and set for offline processing
        chargingStatus.statusType = "error";
        chargingStatus.statusMessage = this.getChargeStatusSystemErrorMessage();
        chargingEvent.sessionStatus = "status_iot_error";
        chargingEvent.exceptionStatus = "pending";
        await this.chargingEventService.saveChargingEvent(chargingEvent);
        transactionLock[chargingEvent.id] = false;

        chargingStatus.sessionStatus = chargingEvent.sessionStatus;
        response.send(chargingStatus);
        return;
      }

      // InProgress status and return latest charge status
      if (chargingStatus.sessionStatus === 'charging' && !isStopped && chargingStatus.chargeComplete == 0) {
        transactionLock[eventId] = false;
        chargingStatus.sessionStatus = chargingEvent.sessionStatus;
        response.send(chargingStatus);
        return;
      }

      // Check for zero dollar session and update DB and return
      if (chargingStatus.sessionTotalCost == 0) {
        chargingStatus.statusType = "info";
        chargingStatus.statusMessage = this.getNoPowerMessage();
        chargingEvent.sessionStatus = "zero_session";
        await this.chargingEventService.saveChargingEvent(chargingEvent);
        transactionLock[eventId] = false;

        chargingStatus.sessionStatus = chargingEvent.sessionStatus;
        response.send(chargingStatus);
        return;
      }

      if (isStopped) {
        chargingStatus.statusType = "success";
        chargingStatus.statusMessage = this.getSuccessStopMessage(user.billingPlanId);
        chargingEvent.sessionStatus = 'stopped';
      } else if (chargingStatus.chargeComplete == 1) {
        chargingStatus.statusType = "success";
        chargingStatus.statusMessage = this.getSuccessCompleteMessage(user.billingPlanId);
        chargingEvent.sessionStatus = "completed";
      } else if (chargingStatus.sessionStatus === 'idle') {
        chargingStatus.statusType = "success";
        chargingStatus.statusMessage = this.getSuccessCompleteMessage(user.billingPlanId);
        chargingEvent.sessionStatus = "idle";
      } else {
        // all other statuses – treat as IOT App Error
        // "available", "trickle", "charging", "offline", “lost-network” 
        chargingStatus.statusType = "success";
        chargingStatus.statusMessage = this.getSuccessCompleteMessage(user.billingPlanId);
        chargingEvent.sessionStatus = chargingStatus.sessionStatus;
      }

      // Assign charging event data
      chargingEvent.chargeStatusPercentage = chargingStatus.chargeStatusPercentage;
      chargingEvent.chargeDeliveredKwh = chargingStatus.chargeDeliveredKwh;
      chargingEvent.chargeSpeedKwh = chargingStatus.chargeSpeedKwh;
      chargingEvent.chargeVehicleRequestedKwh = chargingStatus.chargeVehicleRequestedKwh;
      chargingEvent.rateActivekWh = chargingStatus.rateActivekWh;
      chargingEvent.totalChargeTime = chargingStatus.sessionTotalDuration;

      let chargingData;
      try {
        chargingData = (await this.chargingIoTService.completeCharging(eventId)).data;
        if (chargingData.status != 1) {
          throw Error("IOT CompleteCharging failed with status=0");
        }
      } catch (error) {
        this.logger.error("Complete Charge IOT error: ", error);
        
        chargingStatus.statusType = "success";
        chargingStatus.statusMessage = this.getSuccessCompleteMessage(user.billingPlanId);
        chargingEvent.sessionStatus = "complete_iot_error";
        chargingEvent.exceptionStatus = "pending";
        await this.chargingEventService.saveChargingEvent(chargingEvent);
        transactionLock[eventId] = false;

        chargingStatus.sessionStatus = chargingEvent.sessionStatus;
        response.send(chargingStatus);
        return;
      }

      chargingEvent.totalCostDollars = Number(chargingData.sessionTotalCost) && Math.max(chargingData.sessionTotalCost, 0.5);
      chargingStatus.sessionTotalCost = chargingEvent.totalCostDollars;
      try {
        if (!chargingEvent.paymentIntentId && chargingEvent.totalCostDollars) {
          const timeZone = 'America/Los_Angeles';
          const today = new Date().toLocaleString('sv', { timeZone });
          const PROMO1_FROM_DATE = Environment.PROMO1_FROM_DATE.toLocaleString('sv', { timeZone });
          const PROMO1_TO_DATE = Environment.PROMO1_TO_DATE.toLocaleString('sv', { timeZone });
          
          let actualCost = chargingEvent.totalCostDollars;
          this.logger.info(`Is charging event time '${today}' within promotion time range '${PROMO1_FROM_DATE}' to '${PROMO1_TO_DATE}': ${PROMO1_FROM_DATE <= today && today < PROMO1_TO_DATE}`);
          if (PROMO1_FROM_DATE <= today && today < PROMO1_TO_DATE) {
            actualCost = Math.min(actualCost, 1);
            // Promotion message for transaction plan
            if (chargingStatus.billingPlanId == 1) {
              chargingStatus.statusMessage = this.getPromotionMessage();
              chargingStatus.statusType = 'success';
            }
          }
          if (user.billingPlanId == 1) {
            const { data: paymentIntent } = await this.externalService.psCompleteCharge({
              amount: actualCost,
              idempotencyKey: `transaction_charge_${chargingEvent.id}`,
              description: `NXU Charging Event=${chargingEvent.id}, Station=${chargingEvent.stationId}`
            }, request.headers.authorization as string);
            chargingEvent.paymentIntentId = paymentIntent.id;
          }
        }
      } catch (error) {
        this.logger.error("Payment error: ", error);
        
        // set customer messaging to success as offline process will handle
        chargingStatus.statusType = "success";
        chargingStatus.statusMessage = this.getSuccessCompleteMessage(user.billingPlanId);

        chargingEvent.sessionStatus = 'payment_error';
        chargingEvent.exceptionStatus = 'pending';

        await this.chargingEventService.saveChargingEvent(chargingEvent);
        transactionLock[eventId] = false;

        chargingStatus.sessionStatus = chargingEvent.sessionStatus;
        response.send(chargingStatus);
        return;
      }

      // Update the DB – tbl_charging_events
      await this.chargingEventService.saveChargingEvent(chargingEvent);

      // Release the server side lock
      transactionLock[eventId] = false;
      chargingStatus.sessionStatus = chargingEvent.sessionStatus;
      response.send(chargingStatus);
    } catch (error) {
      this.logger.error("Charging Status System Error: ", error);

      // return an App to the frontend
      chargingStatus.statusType = "error";
      chargingStatus.statusMessage = this.getChargeStatusSystemErrorMessage();
      if (chargingEvent) {
        chargingEvent.sessionStatus = "charging_status_system_error";
        chargingEvent.exceptionStatus = "pending";
        await this.chargingEventService.saveChargingEvent(chargingEvent);
        chargingStatus.sessionStatus = chargingEvent.sessionStatus;
      }
      transactionLock[eventId] = false;
      response.send(chargingStatus);
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

  getSuccessCompleteMessage(billingPlanId: number) {
    switch (billingPlanId) {
      case 1: // transaction
        return "Successfully completed charging. Transaction will be charged to the credit card on file. Please remove the charge handle from the vehicle.";
      case 2: // subscription
        return "Successfully completed charging. You are on the Subscription billing plan, transaction will not be charged to the credit card on file.";   
    }
    // partner
    return "Successfully completed charging.";
  }

  getSuccessStopMessage(billingPlanId: number) {
    switch (billingPlanId) {
      case 1: // transaction
        return "Successfully stopped charging. Transaction will be charged to the credit card on file. Please remove charge handle from the vehicle."; 
      case 2: // subscription
        return "Successfully stopped charging. You are on the Subscription billing plan, transaction will not be charged to the credit card on file.";
    }
    // partner
    return "Successfully stopped charging.";
  }

  getIOTErorMessage(billingPlanId: number) {
    switch (billingPlanId) {
      case 1: // transaction
        return "An error occurred before completing charge. Partial charging transaction will be charged to credit card on file. Please remove charge handle from the vehicle and retry charging."; 
      case 2: // subscription
        return "An error occurred before completing charge. You are on the Subscription billing plan, transaction will not be charged to the credit card on file. Please remove charge handle from the vehicle and retry charging.";  
    }
    // partner
    return "An error occurred before completing charge. Please remove charge handle from the vehicle and retry charging."; 
  }

  getNoPowerMessage()  {
    return "Vehicle is not requesting any power. Please remove charge handle from the vehicle and retry charging.";
  }

  getChargeStatusSystemErrorMessage() {
    return "System Error..please try again or call 480-573-2001 for support.";
  }

  getPromotionMessage(){
    return "Product Launch promotion: $1 per charging session. Only $1 will be charged to your credit card.";
  }
}