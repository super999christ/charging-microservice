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

import { UserPhoneService } from "../database/user-phone/user-phone.service";
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
import { UpdateCreditCardDto } from "./dtos/UpdateCreditCard.dto";
import { UpdatePasswordDto } from "./dtos/UpdatePassword.dto";
import { AxiosError } from "axios";
import { convert2StandardPhoneNumber } from "../utils/phone.util";

@Controller()
export class AppController {
  @Inject()
  private userService: UserService;

  @Inject()
  private userRegistrationService: UserRegistrationService;

  @Inject()
  private passwordResetService: PasswordResetService;

  @Inject()
  private userPhoneService: UserPhoneService;

  @Inject()
  private externalService: ExternalService;

  @Post("login")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Login with user credentials" })
  public async loginUser(
    @Body() userCredentials: LoginUserDto,
    @Response() response: IResponse
  ) {
    const { email, password } = userCredentials;
    try {
      const user = await this.userService.validateUser(email, password);

      if (!user) {
        response.sendStatus(404);
      } else {
        const { data } = await this.externalService.asRequestUserToken({
          userId: user.id,
        });
        response.status(200).send(data);
      }
    } catch (err) {
      console.error("@Error: ", err);
      response.sendStatus(500);
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
      const phoneExisting = await this.userPhoneService.getUserPhone(
        phoneNumber
      );
      if (phoneExisting) {
        response.status(400).send("PhoneNumber already exists");
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
      console.error("@Error: ", err);
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
      console.error("@Error: ", err);
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
      console.error("@Error: ", err);
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
    const {
      email,
      phoneNumber,
      password,
      smsAuthCode,
      smsNotificationId,
      firstName,
      lastName,
      cardNumber,
      expYear,
      expMonth,
      cvc,
      rId,
    } = confirmDetails;
    try {
      const registration =
        await this.userRegistrationService.getUserRegistration(rId);
      if (
        !registration ||
        registration.verified ||
        new Date().getTime() - registration.createdDate.getTime() > 3600 * 1000
      ) {
        response.status(400).send("Link already expired");
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
          const paymentData = await this.externalService.psSaveCC({
            cardNumber,
            expYear,
            expMonth,
            cvc,
            customerEmail: email,
            customerName: firstName + " " + lastName,
          });

          const user = await this.userService.saveUser({
            email,
            password,
            firstName,
            lastName,
            verified: true,
            stripePmId: paymentData.pmId,
            stripeCustomerId: paymentData.customerId,
            tcFlag: true,
          });
          const userPhone = await this.userPhoneService.saveUserPhone({
            user: { id: user.id },
            phoneNumber,
            active: true,
          });
          await this.userRegistrationService.updateRegistration(rId, {
            verified: true,
          });
          response.send({
            message: "User registration confirmed",
            user,
            userPhone,
          });
        } catch (err) {
          response.status(400).send("Credit card information is incorrect");
        }
      }
    } catch (err) {
      response.status(400).send("Auth code is incorrect");
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
    try {
      const user = await this.userService.getUser(userId);
      const phone = await this.userPhoneService.getPhoneNumberByUserId(userId);
      if (!user || !phone) {
        res.sendStatus(404);
        return;
      }
      const paymentData = await this.externalService.psGetCC(user.stripePmId);
      const { id, firstName, lastName, email } = user;
      const { phoneNumber } = phone;
      const { last4, expYear, expMonth } = paymentData;

      res.status(200).send({
        id,
        firstName,
        lastName,
        phoneNumber,
        email,
        last4,
        expYear,
        expMonth,
      });
    } catch (err) {
      console.error("@Error: ", err);
      res.sendStatus(500);
    }
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

  @Put("profile/creditcard")
  @ApiOperation({ summary: "Update Creditcard" })
  @ApiBearerAuth()
  public async updateCreditCard(
    @Body() params: UpdateCreditCardDto,
    @Request() req: IRequest,
    @Response() response: IResponse
  ) {
    const { cardNumber, cvc, expYear, expMonth } = params;
    const userId = (req as any).userId;
    try {
      const user = await this.userService.getUser(userId);
      const { pmId } = await this.externalService.psUpdateCC({
        cardNumber,
        cvc,
        expYear,
        expMonth,
        pmId: user?.stripePmId as string,
      });
      await this.userService.updateUserById(userId, {
        stripePmId: pmId,
      });
      response.send("success");
    } catch (err) {
      console.log("@Error: ", err);
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
      const userPhone = await this.userPhoneService.getUserPhone(phoneNumber);
      if (!userPhone) {
        res.sendStatus(404);
        return;
      }
      res.status(200).send(userPhone);
    } catch (err) {
      console.error("@Error: ", err);
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
      console.error("@Error: ", err);
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
      console.error("@Error: ", err);
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
      console.error("@Error: ", err);
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
      console.error("@Error: ", err);
      response.sendStatus(401);
    }
  }

  @Get("healthz")
  public async healthz(@Response() response: IResponse) {
    return response.sendStatus(200);
  }
}
