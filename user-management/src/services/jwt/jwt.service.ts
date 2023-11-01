import { Inject, Injectable } from "@nestjs/common";
import { JwtService as NestJsJwtService } from "@nestjs/jwt";

@Injectable()
export class JwtService {
  @Inject(NestJsJwtService)
  private jwt: NestJsJwtService;

  public generateToken(payload: Record<string, any>, expiresIn = 3600) {
    return this.jwt.sign(payload, { expiresIn });
  }

  public validateToken(token: string) {
    try {
      const authToken = token.split(" ")[1];
      const decoded = this.jwt.verify(authToken, { ignoreExpiration: false });
      return decoded;
    } catch (err) {
      return null;
    }
  }
}
