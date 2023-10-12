import { Injectable, NestMiddleware, Inject } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { JwtService } from "../services/jwt/jwt.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  @Inject()
  private jwtService: JwtService;

  use(request: Request, res: Response, next: NextFunction) {
    const decodedToken = this.jwtService.validateToken(
      request.headers.authorization!
    );

    if (!decodedToken) return res.sendStatus(401);

    const { userId, subscription_customer } = decodedToken;

    (request as any).userId = userId;
    (request as any).subscription_customer = subscription_customer;

    return next();
  }
}
