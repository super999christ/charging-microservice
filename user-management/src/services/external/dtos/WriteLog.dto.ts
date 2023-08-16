import { LogLevel } from "@nestjs/common";

export class WriteLogDto {
  message: string;
  logLevel: LogLevel;
  appName: string;
  metadata?: string;
};