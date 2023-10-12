import { Module } from "@nestjs/common";
import { JwtModule } from "../services/jwt/jwt.module";

@Module({
  imports: [JwtModule],
})
export class AuthModule {}
