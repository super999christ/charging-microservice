import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PartnerAccount } from "./partnerAccount.entity";

@Injectable()
export class PartnerAccountService {
  @InjectRepository(PartnerAccount)
  private repository: Repository<PartnerAccount>;

  public async getPartnerAccountByCode(accountCode: string) {
    const account = await this.repository.findOneBy({ accountCode, active: true });
    return account || null;
  }
}
