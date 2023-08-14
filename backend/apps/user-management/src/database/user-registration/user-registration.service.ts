import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import Environment from "../../config/env";
import { UserRegistration } from "./user-registration.entity";

@Injectable()
export class UserRegistrationService {
  @InjectRepository(UserRegistration)
  private userRegistrationRepository: Repository<UserRegistration>;

  public async saveRegistration(
    registrationDetails: DeepPartial<UserRegistration>
  ) {
    return this.userRegistrationRepository.save(registrationDetails);
  }

  public async updateRegistration(
    rId: string,
    newData: DeepPartial<UserRegistration>
  ) {
    return this.userRegistrationRepository.update(rId, newData);
  }

  public async getUserRegistration(rId: string) {
    const user = await this.userRegistrationRepository.findOneBy({ id: rId });
    return user;
  }

  public async deleteUserRegistration(rId: string) {
    const result = await this.userRegistrationRepository.delete({ id: rId });
    return result;
  }
}
