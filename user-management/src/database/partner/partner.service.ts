import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { Partner } from "./partner.entity";

@Injectable()
export class PartnerService {
  @InjectRepository(Partner)
  private repository: Repository<Partner>;
}
