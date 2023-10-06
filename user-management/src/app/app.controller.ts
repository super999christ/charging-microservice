import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Post,
  Put,
  Query,
  Request,
  Response,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Response as IResponse, Request as IRequest } from "express";
import { PinoLogger, InjectPinoLogger } from "nestjs-pino";

import { UserService } from "../database/user/user.service";
import { PasswordResetService } from "../database/password-reset/password-reset.service";
import { UserRegistrationService } from "../database/user-registration/user-registration.service";
import { ExternalService } from "../services/external/external.service";
import { LoginUserDto } from "./dtos/LoginUser.dto";
import { RegisterConfirmDto } from "./dtos/RegisterConfirm.dto";
import { RegisterUserDto } from "./dtos/RegisterUser.dto";
import { ValidatePhoneDto } from "./dtos/ValidatePhone.dto";
import { RequestResetPasswordDto } from "./dtos/RequestResetPassword.dto";
import { ResetPasswordDto } from "./dtos/ResetPassword.dto";
import { UpdatePasswordDto } from "./dtos/UpdatePassword.dto";
import { AxiosError } from "axios";
import { convert2StandardPhoneNumber } from "../utils/phone.util";
import { SendLoginAuthcodeDto } from "./dtos/SendLoginAuthcode.dto";
import { BillingPlanService } from "../database/billingPlan/billingPlan.service";
import { JwtService } from "@nestjs/jwt";
import Environment from "../config/env";

@Controller()
export class AppController {
  @InjectPinoLogger(AppController.name)
  private readonly logger: PinoLogger;

  @Inject()
  private userService: UserService;

  @Inject()
  private userRegistrationService: UserRegistrationService;

  @Inject()
  private passwordResetService: PasswordResetService;

  @Inject()
  private externalService: ExternalService;

  @Inject()
  private billingPlansService: BillingPlanService;

  @Inject(JwtService)
  private jwtService: JwtService;

  @Post("login")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Login with user credentials" })
  public async loginUser(
    @Body() userCredentials: LoginUserDto,
    @Response() response: IResponse
  ) {
    let { phoneNumber, authCode, notificationId } = userCredentials;
    phoneNumber = convert2StandardPhoneNumber(phoneNumber);
    try {
      const smsResult = await this.externalService.nsValidateSMSAuthCode({
        authCode,
        notificationId,
        phoneNumber,
      });

      if (!smsResult) {
        response.sendStatus(404);
      } else {
        const user = await this.userService.getUserByPhone(phoneNumber);
        if (!user) {
          response.sendStatus(404);
          return;
        }
        const { data } = await this.externalService.asRequestUserToken({
          userId: user.id,
        });
        response.status(200).send(data);
      }
    } catch (err) {
      this.logger.error(err);
      response.status(400).send("Invalid AuthCode");
    }
  }

  @Post("login-with-pin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Login with user credentials (PIN)" })
  public async loginUserWithPIN(
    @Body() userCredentials: LoginUserDto,
    @Response() response: IResponse
  ) {
    let { phoneNumber, pinCode } = userCredentials;
    phoneNumber = convert2StandardPhoneNumber(phoneNumber);
    try {
      let user = await this.userService.getUserByPhone(phoneNumber);
      if (!user) {
        response.status(404).send("Phone number not registered");
        return;
      } else {
        user = await this.userService.validateUser(user.email, pinCode);
        if (!user) {
          response.status(400).send("Invalid Password");
          return;
        }
        const { data } = await this.externalService.asRequestUserToken({
          userId: user.id,
        });
        response.status(200).send(data);
      }
    } catch (err) {
      this.logger.error(err);
      response.status(400).send("Invalid Password");
    }
  }

  @Post("register")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Register a new user" })
  public async registerUser(
    @Body() userDetails: RegisterUserDto,
    @Response() response: IResponse
  ) {
    let { email, phoneNumber, firstName, lastName } = userDetails;
    try {
      const emailExisting = await this.userService.getUserByEmail(email);
      if (emailExisting) {
        response.status(400).send("Email already exists");
        return;
      }
      phoneNumber = convert2StandardPhoneNumber(phoneNumber);
      if (!phoneNumber) {
        response
          .status(400)
          .send("Please enter 10 digit phone number - no dashes or spaces");
        return;
      }
      const phoneExisting = await this.userService.getUserByPhone(phoneNumber);
      if (phoneExisting) {
        response.status(400).send("Phone number already exists");
        return;
      }
      const smsNotification = (
        await this.externalService.nsSendSMSAuthCode({ phoneNumber })
      ).data;
      const userRegistration =
        await this.userRegistrationService.saveRegistration({
          email,
          phoneNumber,
          firstName,
          lastName,
          smsNotificationId: smsNotification.id,
        });

      const paramString = `registrationId=${userRegistration.id}`;
      const emailNotification = (
        await this.externalService.neSendEmailAuthCode({ email, paramString })
      ).data;
      await this.userRegistrationService.updateRegistration(
        userRegistration.id,
        { emailNotificationId: emailNotification.id }
      );

      response.send({
        message: "Check your inbox for email verification",
        emailNotificationId: emailNotification.id,
        smsNotificationId: smsNotification.id,
      });
    } catch (err) {
      this.logger.error(err);
      response.sendStatus(500);
    }
  }

  @Delete("register")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete registration info" })
  public async deleteRegistrationInfo(
    @Query("rId") rId: string,
    @Response() response: IResponse
  ) {
    try {
      const result = await this.userRegistrationService.deleteUserRegistration(
        rId
      );
      response.send(result);
    } catch (err) {
      this.logger.error(err);
      response.sendStatus(500);
    }
  }

  @Get("register")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get registration info" })
  public async getRegistrationInfo(
    @Query("rId") rId: string,
    @Response() response: IResponse
  ) {
    try {
      const result = await this.userRegistrationService.getUserRegistration(
        rId
      );
      const hourInMs = 3600 * 1000;
      if (
        !result ||
        result.verified ||
        Date.now() - result.createdDate.getTime() > hourInMs
      ) {
        throw Error("Invalid registration link");
      }
      response.send(result);
    } catch (err) {
      this.logger.error(err);
      response.sendStatus(500);
    }
  }

  @Post("register-confirm")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Confirms user registration" })
  public async registerConfirmUser(
    @Body() confirmDetails: RegisterConfirmDto,
    @Response() response: IResponse
  ) {
    let {
      email,
      phoneNumber,
      smsAuthCode,
      smsNotificationId,
      firstName,
      lastName,
    } = confirmDetails;
    try {
      phoneNumber = convert2StandardPhoneNumber(phoneNumber);
      const emailExisting = await this.userService.getUserByEmail(email);
      if (emailExisting) {
        response.status(400).send("Email already exists");
        return;
      }
      if (!phoneNumber) {
        response
          .status(400)
          .send("Please enter 10 digit phone number - no dashes or spaces");
        return;
      }
      const phoneExisting = await this.userService.getUserByPhone(phoneNumber);
      if (phoneExisting) {
        response.status(400).send("PhoneNumber already exists");
        return;
      }
      const smsResult = (
        await this.externalService.nsValidateSMSAuthCode({
          authCode: smsAuthCode,
          notificationId: smsNotificationId,
          phoneNumber,
        })
      ).data;
      if (smsResult) {
        try {
          const user = await this.userService.saveUser({
            email,
            password: "None",
            firstName,
            lastName,
            verified: true,
            tcFlag: true,
            phoneNumber,
          });
          const { data: tokenData } =
            await this.externalService.asRequestUserToken({
              userId: user.id,
            });
          response.send({
            message: "User registration confirmed",
            user,
            token: tokenData.token,
          });
        } catch (err) {
          response.status(400).send("Credit card information is incorrect");
        }
      }
    } catch (err) {
      this.logger.error(err);
      response.status(400).send("Auth code is incorrect");
    }
  }

  @Post("register-confirm-with-pin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Confirms user registration with PIN" })
  public async registerConfirmUserWithPIN(
    @Body() confirmDetails: RegisterConfirmDto,
    @Response() response: IResponse
  ) {
    let { email, phoneNumber, pinCode, firstName, lastName } = confirmDetails;
    try {
      phoneNumber = convert2StandardPhoneNumber(phoneNumber);
      const emailExisting = await this.userService.getUserByEmail(email);
      if (emailExisting) {
        response.status(400).send("Email already exists");
        return;
      }
      if (!phoneNumber) {
        response
          .status(400)
          .send("Please enter 10 digit phone number - no dashes or spaces");
        return;
      }
      const phoneExisting = await this.userService.getUserByPhone(phoneNumber);
      if (phoneExisting) {
        response.status(400).send("Phone number already exists");
        return;
      }

      const user = await this.userService.saveUser({
        email,
        password: pinCode,
        firstName,
        lastName,
        verified: true,
        tcFlag: true,
        phoneNumber,
      });
      const { data: tokenData } = await this.externalService.asRequestUserToken(
        {
          userId: user.id,
        }
      );
      response.send({
        message: "User registration confirmed",
        user,
        token: tokenData.token,
      });
    } catch (err) {
      this.logger.error(err);
      response.status(400).send("Failed to register user with pincode");
    }
  }

  @Get("profile")
  @ApiOperation({ summary: "Get user profile" })
  @ApiBearerAuth()
  public async getUserProfile(
    @Request() req: IRequest,
    @Response() res: IResponse
  ) {
    const userId = (req as any).userId;

    const user = await this.userService.getUser(userId);
    if (!user) return res.sendStatus(404);

    return res.send({ ...user });
  }

  @Put("profile")
  public async updateUser(
    @Body() body: { billingPlanId: number; vehicleCount: number },
    @Request() req: IRequest,
    @Response() res: IResponse
  ) {
    const userId = (req as any).userId;
    const { billingPlanId, vehicleCount } = body;
    this.userService.updateUserById(userId, { billingPlanId, vehicleCount });
    return res.sendStatus(204);
  }

  @Put("profile/password")
  @ApiOperation({ summary: "Update Password" })
  @ApiBearerAuth()
  public async updatePassword(
    @Body() params: UpdatePasswordDto,
    @Request() req: IRequest,
    @Response() response: IResponse
  ) {
    const userId = (req as any).userId;
    const { password } = params;
    try {
      await this.userService.updateUserById(userId, {
        password,
      });
      response.send("success");
    } catch (err) {
      if (err instanceof AxiosError)
        response.status(500).send(err.response?.data);
    }
  }

  @Post("validate-phone")
  @ApiOperation({ summary: "Validates phone number within the DB" })
  @ApiBearerAuth()
  public async validatePhoneNumber(
    @Body() body: ValidatePhoneDto,
    @Response() res: IResponse
  ) {
    let { phoneNumber } = body;
    phoneNumber = convert2StandardPhoneNumber(phoneNumber);
    try {
      const user = await this.userService.getUserByPhone(phoneNumber);
      if (!user) {
        res.sendStatus(404);
        return;
      }
      res.status(200).send(user);
    } catch (err) {
      this.logger.error(err);
      res.sendStatus(500);
    }
  }

  @Post("request-reset-password")
  @ApiOperation({ summary: "Request Password changes for a user" })
  @ApiBearerAuth()
  public async requestResetPassword(
    @Body() userCredentials: RequestResetPasswordDto,
    @Response() response: IResponse
  ) {
    const { email } = userCredentials;
    try {
      const existingUser = this.userService.getUserByEmail(email);
      if (!existingUser) {
        response.sendStatus(401);
        return;
      }

      const passwordResetInfo =
        await this.passwordResetService.savePasswordResetDetail({
          email,
        });

      const paramString = `passwordResetId=${passwordResetInfo.id}`;
      const emailNotification = (
        await this.externalService.neSendPasswordResetLink({
          email,
          paramString,
        })
      ).data;
      await this.passwordResetService.updatePasswordResetDetail(
        passwordResetInfo.id,
        { emailNotificationId: emailNotification.id }
      );

      response.send({
        message: "Check your inbox for email verification",
        emailNotificationId: emailNotification.id,
      });
    } catch (err) {
      this.logger.error(err);
      response.sendStatus(500);
    }
  }

  @Delete("request-reset-password")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete registration info" })
  public async deleteResetPasswordInfoInfo(
    @Query("rId") rId: string,
    @Response() response: IResponse
  ) {
    try {
      const result = await this.passwordResetService.deletePasswordResetDetail(
        rId
      );
      response.send(result);
    } catch (err) {
      this.logger.error(err);
      response.sendStatus(500);
    }
  }

  @Get("request-reset-password")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get password reset information" })
  public async getResetPasswordInfo(
    @Query("rId") rId: string,
    @Response() response: IResponse
  ) {
    try {
      const result = await this.passwordResetService.getPasswordResetDetail(
        rId
      );
      if (
        !result ||
        result.verified ||
        new Date().getTime() - result.createdDate.getTime() > 3600 * 1000
      ) {
        response.status(400).send("Link already expired");
        return;
      }
      await this.passwordResetService.updatePasswordResetDetail(rId, {
        verified: true,
      });
      response.send(result);
    } catch (err) {
      this.logger.error(err);
      response.sendStatus(500);
    }
  }

  @Post("reset-password")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reset Password for account" })
  public async resetPassword(
    @Body() body: ResetPasswordDto,
    @Response() response: IResponse
  ) {
    const { email, password } = body;
    try {
      const data = this.userService.resetPassword(email, password);
      response.send("success");
    } catch (err) {
      this.logger.error(err);
      response.sendStatus(401);
    }
  }

  @Post("send-login-authcode")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Send Login authcode" })
  public async sendLoginAuthCode(
    @Body() body: SendLoginAuthcodeDto,
    @Response() response: IResponse
  ) {
    let { phoneNumber } = body;
    try {
      phoneNumber = convert2StandardPhoneNumber(phoneNumber);
      if (!phoneNumber) {
        response
          .status(400)
          .send("Please enter 10 digit phone number - no dashes or spaces");
        return;
      }
      const user = await this.userService.getUserByPhone(phoneNumber);
      if (!user) {
        response.status(401).send("Phone number not registered");
        return;
      }
      // Saves a new event in the DB
      const { data: notification } =
        await this.externalService.nsSendSMSAuthCode({ phoneNumber });
      response.status(200).send(notification);
    } catch (err) {
      this.logger.error(err);
      response.status(401).send("SMS code request error please try again");
    }
  }

  @Post("send-register-authcode")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Send Register authcode" })
  public async sendRegisterAuthCode(
    @Body() body: SendLoginAuthcodeDto,
    @Response() response: IResponse
  ) {
    let { phoneNumber } = body;
    try {
      phoneNumber = convert2StandardPhoneNumber(phoneNumber);
      if (!phoneNumber) {
        response
          .status(400)
          .send("Please enter 10 digit phone number - no dashes or spaces");
        return;
      }
      const user = await this.userService.getUserByPhone(phoneNumber);
      if (user) {
        response.status(401).send("Phone number already registered");
        return;
      }
      // Saves a new event in the DB
      const { data: notification } =
        await this.externalService.nsSendSMSAuthCode({ phoneNumber });
      response.status(200).send(notification);
    } catch (err) {
      this.logger.error(err);
      response.status(401).send("SMS code request error please try again");
    }
  }

  @Get("billing-plans")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Send Register authcode" })
  public async getBillingPlans(@Response() res: IResponse) {
    const billingPlans = await this.billingPlansService.getBillingPlans();
    return res.send(billingPlans);
  }

  @Post("request-user-token")
  @ApiOperation({ summary: "Generates User JWT" })
  public async requestUserToken(
    @Body() body: { userId: string },
    @Response() res: IResponse
  ) {
    const user = await this.userService.getUser(body.userId);

    if (!user)
      return res
        .status(400)
        .send(`No user exists with userId '${body.userId}'`);

    const subscription_customer =
      Environment.TRIAL_SUBSCRIPTION_CUSTOMERS.split(",").includes(
        user.phoneNumber
      );

    const token = this.jwtService.sign({
      sub: user.id,
      userId: user.id,
      subscription_customer,
    });
    return res.send({ token });
  }

  @Post("validate-user-token")
  @ApiOperation({ summary: "Validates User JWT" })
  public async validateUserToken(
    @Body() body: { token: string },
    @Response() res: IResponse
  ) {
    try {
      const payload = this.jwtService.verify(body.token.split(" ")[1], {
        ignoreExpiration: false,
      });
      if (!payload) return res.send({ isValid: false });

      if (payload) return res.send({ isValid: true, ...payload });
    } catch (err) {
      return res.send({ isValid: false });
    }
  }

  @Get("healthz")
  public async healthz(@Response() res: IResponse) {
    return res.sendStatus(200);
  }
}
