import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle("ChargingEvent Microservice")
    .setDescription("ChargingEvent API description")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("docs", app, document);

  app.enableCors();

  await app.startAllMicroservices();

  await app.listen(3000);

  console.log("ChargingEvent Microservice is listening");
}

bootstrap();
