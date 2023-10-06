import { Module, RequestMethod, MiddlewareConsumer } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeOrmConfig } from "../typeorm/typeorm.config";
import { UserModule } from "../database/user/user.module";
import { UserRegistrationModule } from "../database/user-registration/user-registration.module";
import { PasswordResetModule } from "../database/password-reset/password-reset.module";
import { ExternalModule } from "../services/external/external.module";
import { AppController } from "./app.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { BillingPlanModule } from "../database/billingPlan/billingPlan.module";
import { SubscriptionChargesModule } from "../database/subscriptionCharges/subscriptionCharges.module";
import { JwtModule } from "@nestjs/jwt";
import Environment from "../config/env";

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    LoggerModule.forRoot({
      exclude: [{ method: RequestMethod.ALL, path: "healthz" }],
    }),
    JwtModule.register({
      secret: Environment.TOKEN_SECRET_KEY,
      signOptions: { expiresIn: "1h" },
    }),
    UserModule,
    UserRegistrationModule,
    PasswordResetModule,
    ExternalModule,
    BillingPlanModule,
    SubscriptionChargesModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: "/profile", method: RequestMethod.ALL },
        { path: "/profile/password", method: RequestMethod.ALL }
      );
  }
}
