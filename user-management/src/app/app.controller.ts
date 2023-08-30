import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
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
import { UpdatePasswordDto } from "./dtos/UpdatePassword.dto";
import { AxiosError } from "axios";
import { convert2StandardPhoneNumber } from "../utils/phone.util";
import { SendLoginAuthcodeDto } from "./dtos/SendLoginAuthcode.dto";

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

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
        const userPhone = await this.userPhoneService.getUserPhone(phoneNumber);
        if (!userPhone) {
          response.sendStatus(404);
          return;
        }
        const { data } = await this.externalService.asRequestUserToken({
          userId: userPhone.user.id,
        });
        response.status(200).send(data);
      }
    } catch (err) {
      console.error("@Error: ", err);
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
      const userPhone = await this.userPhoneService.getUserPhone(phoneNumber);
      if (!userPhone) {
        response.status(404).send("Phone No. not registered");
        return;
      } else {
        const user = await this.userService.validateUser(
          userPhone.user.email,
          pinCode
        );
        if (!user) {
          response.status(400).send("Invalid PIN");
          return;
        }
        const { data } = await this.externalService.asRequestUserToken({
          userId: userPhone.user.id,
        });
        response.status(200).send(data);
      }
    } catch (err) {
      console.error("@Error: ", err);
      response.status(400).send("Invalid PIN");
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
      const phoneExisting = await this.userPhoneService.getUserPhone(
        phoneNumber
      );
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
          });
          const userPhone = await this.userPhoneService.saveUserPhone({
            user: { id: user.id },
            phoneNumber,
            active: true,
          });
          const { data: tokenData } =
            await this.externalService.asRequestUserToken({
              userId: userPhone.user.id,
            });
          response.send({
            message: "User registration confirmed",
            user,
            userPhone,
            token: tokenData.token,
          });
        } catch (err) {
          response.status(400).send("Credit card information is incorrect");
        }
      }
    } catch (err) {
      console.error("@Error: ", err);
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
      const phoneExisting = await this.userPhoneService.getUserPhone(
        phoneNumber
      );
      if (phoneExisting) {
        response.status(400).send("PhoneNumber already exists");
        return;
      }

      const user = await this.userService.saveUser({
        email,
        password: pinCode,
        firstName,
        lastName,
        verified: true,
        tcFlag: true,
      });
      const userPhone = await this.userPhoneService.saveUserPhone({
        user: { id: user.id },
        phoneNumber,
        active: true,
      });
      const { data: tokenData } = await this.externalService.asRequestUserToken(
        {
          userId: userPhone.user.id,
        }
      );
      response.send({
        message: "User registration confirmed",
        user,
        userPhone,
        token: tokenData.token,
      });
    } catch (err) {
      this.logger.error(JSON.stringify(err));
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
    try {
      const user = await this.userService.getUser(userId);
      const phone = await this.userPhoneService.getPhoneNumberByUserId(userId);
      if (!user || !phone) {
        res.sendStatus(404);
        return;
      }

      const { id, firstName, lastName, email } = user;
      const { phoneNumber } = phone;

      res.status(200).send({
        id,
        firstName,
        lastName,
        phoneNumber,
        email,
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
      const userPhone = await this.userPhoneService.getUserPhone(phoneNumber);
      if (!userPhone) {
        response.status(401).send("Phone No. not registered");
        return;
      }
      // Saves a new event in the DB
      const { data: notification } =
        await this.externalService.nsSendSMSAuthCode({ phoneNumber });
      response.status(200).send(notification);
    } catch (error) {
      console.error("@Error: ", error);
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
      const userPhone = await this.userPhoneService.getUserPhone(phoneNumber);
      if (userPhone) {
        response.status(401).send("Phone No. already registered");
        return;
      }
      // Saves a new event in the DB
      const { data: notification } =
        await this.externalService.nsSendSMSAuthCode({ phoneNumber });
      response.status(200).send(notification);
    } catch (error) {
      console.error("@Error: ", error);
      response.status(401).send("SMS code request error please try again");
    }
  }

  @Get("healthz")
  public async healthz(@Response() response: IResponse) {
    return response.sendStatus(200);
  }
}
