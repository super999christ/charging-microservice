import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { PasswordReset } from "./password-reset.entity";

@Injectable()
export class PasswordResetService {
  @InjectRepository(PasswordReset)
  private passwordResetRepository: Repository<PasswordReset>;

  public async savePasswordResetDetail(
    passwordResetDetails: DeepPartial<PasswordReset>
  ) {
    return this.passwordResetRepository.save(passwordResetDetails);
  }

  public async updatePasswordResetDetail(
    rId: string,
    newData: DeepPartial<PasswordReset>
  ) {
    return this.passwordResetRepository.update(rId, newData);
  }

  public async getPasswordResetDetail(rId: string) {
    const user = await this.passwordResetRepository.findOneBy({ id: rId });
    return user;
  }

  public async deletePasswordResetDetail(rId: string) {
    const result = await this.passwordResetRepository.delete({ id: rId });
    return result;
  }
}
