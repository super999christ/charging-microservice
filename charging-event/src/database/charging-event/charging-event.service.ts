import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, In, LessThan, MoreThan, Not, Repository } from "typeorm";
import { ChargingEvent } from "./charging-event.entity";

@Injectable()
export class ChargingEventService {
  @InjectRepository(ChargingEvent)
  private chargingEventRepository: Repository<ChargingEvent>;

  public async saveChargingEvent(chargingEvent: DeepPartial<ChargingEvent>) {
    return this.chargingEventRepository.save(chargingEvent);
  }

  public async deleteChargingEvent(eventId: number) {
    return this.chargingEventRepository.delete(eventId);
  }

  public async getChargingEvent(id: number) {
    return this.chargingEventRepository.findOneBy({ id });
  }

  public async getTransactions(userId: string) {
    return this.chargingEventRepository.find({
      where: { userId, chargeDeliveredKwh: Not(0) },
      order: { createdDate: "DESC" },
    });
  }

  public async getLatestChargingEvents(userId: string) {
    const fourHoursAgo = new Date(new Date().getTime() - 3600 * 1000 * 4);
    return this.chargingEventRepository.find({
      where: [
        {
          userId,
          sessionStatus: In(["in_progress", "charging"]),
          updatedDate: MoreThan(fourHoursAgo),
        }
      ],
      order: { createdDate: "DESC" },
      take: 5,
    });
  }

  public async getPendingChargingEvents() {
    const dateThreshold = new Date(new Date().getTime() - 3600 * 1000 * 4);
    return this.chargingEventRepository.find({
      where: [
        { sessionStatus: "in_progress", updatedDate: LessThan(dateThreshold) },
        { exceptionStatus: "pending" },
      ],
    });
  }
}
