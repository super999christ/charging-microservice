import { Injectable, NestMiddleware } from "@nestjs/common";
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import Environment from "../config/env";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    axios.post(`${Environment.SERVICE_API_AUTH_URL}/validate-user-token`, {
      token: request.headers.authorization
    }).then(res => {
      if (res.data.isValid) {
        (request as any).userId = res.data.userId;
        next();
      } else {
        response.sendStatus(401);
      }
    }).catch(err => {
      console.error("@Error: ", err);
      response.sendStatus(401);
    });
  }
}