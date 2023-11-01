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
import { SubscriptionChargeModule } from "../database/subscriptionCharge/subscriptionCharge.module";
import { JwtModule } from "../services/jwt/jwt.module";
import { CronModule } from "../services/cron/cron.module";
import { SubscriptionUpdateModule } from "../database/subscriptionUpdate/subscriptionUpdate.module";
import { SubscriptionPricingModule } from "../database/subscriptionPricing/subscriptionPricing.module";

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    LoggerModule.forRoot({
      exclude: [{ method: RequestMethod.ALL, path: "healthz" }],
    }),
    UserModule,
    UserRegistrationModule,
    PasswordResetModule,
    ExternalModule,
    BillingPlanModule,
    SubscriptionChargeModule,
    SubscriptionUpdateModule,
    SubscriptionPricingModule,
    JwtModule,
    CronModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: "/profile", method: RequestMethod.ALL },
        { path: "/profile/password", method: RequestMethod.ALL },
        { path: "/subscriptions", method: RequestMethod.ALL },
        { path: "/subscription-updates", method: RequestMethod.ALL },
        { path: "/active-subscription-pricing", method: RequestMethod.ALL },
      );
  }
}
