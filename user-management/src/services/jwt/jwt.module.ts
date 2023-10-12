import { Module } from "@nestjs/common";
import { JwtModule as NestJsJwtModule } from "@nestjs/jwt";
import Environment from "../../config/env";
import { JwtService } from "./jwt.service";

@Module({
  imports: [
    NestJsJwtModule.register({
      secret: Environment.TOKEN_SECRET_KEY,
      signOptions: { expiresIn: "1h" },
    }),
  ],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
