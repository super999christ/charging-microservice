import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { UserPhone } from "./user-phone.entity";

@Injectable()
export class UserPhoneService {
  @InjectRepository(UserPhone)
  private userPhoneRepository: Repository<UserPhone>;

  public async saveUserPhone(userDetails: DeepPartial<UserPhone>) {
    return this.userPhoneRepository.save(userDetails);
  }

  public async getUserPhone(phoneNumber: string) {
    return this.userPhoneRepository.findOne({ where: { phoneNumber }, relations: ['user'] })
  }

  public async getPhoneNumberByUserId(userId: string) {
    return this.userPhoneRepository.findOneBy({ user: { id: userId } });
  }

  public async updatePhoneNumberByUserId(userId: string, phoneNumber: string) {
    const phoneNumberRecord = this.userPhoneRepository.update(
      { user: { id: userId } },
      { phoneNumber }
    );
    return phoneNumberRecord;
  }
}
