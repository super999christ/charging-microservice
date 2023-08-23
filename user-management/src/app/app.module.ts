import { Module, RequestMethod, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeOrmConfig } from "../typeorm/typeorm.config";
import { UserPhoneModule } from "../database/user-phone/user-phone.module";
import { UserModule } from "../database/user/user.module";
import { UserRegistrationModule } from "../database/user-registration/user-registration.module";
import { PasswordResetModule } from "../database/password-reset/password-reset.module";
import { ExternalModule } from "../services/external/external.module";
import { AppController } from "./app.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    UserModule,
    UserRegistrationModule,
    PasswordResetModule,
    UserPhoneModule,
    ExternalModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: "/profile", method: RequestMethod.GET },
        { path: "/profile/password", method: RequestMethod.PUT },
        { path: "/profile/creditcard", method: RequestMethod.PUT }
      );
  }
}
