import { Injectable, NestMiddleware } from "@nestjs/common";
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import Environment from "../config/env";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    axios
      .post(`${Environment.SERVICE_API_AUTH_URL}/validate-user-token`, {
        token: request.headers.authorization,
      })
      .then((res) => {
        const { isValid, userId } = res.data;
        if (isValid) {
          (request as any).userId = userId;
          next();
        } else {
          response.sendStatus(401);
        }
      });
  }
}
