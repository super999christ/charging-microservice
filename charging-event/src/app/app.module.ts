import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChargingEventModule } from "../database/charging-event/charging-event.module";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { ExternalModule } from "../services/external/external.module";
import { typeOrmConfig } from "../typeorm/typeorm.config";
import { AppController } from "./app.controller";
import { ChargingIoTModule } from "../services/charging-iot/charging-iot.module";

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    LoggerModule.forRoot({
      exclude: [{ method: RequestMethod.ALL, path: "healthz" }]
    }),
    ChargingEventModule,
    ExternalModule,
    ChargingIoTModule
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).forRoutes();
  }
}
