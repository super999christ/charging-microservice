const globalChargingStatus: any = {}; // Temporary solution

export const getGlobalChargingStatus = (eventId: number) => {
  return globalChargingStatus[eventId];
};

export const setGlobalChargingStatus = (eventId: number, eventStatus: string) => {
  globalChargingStatus[eventId] = eventStatus;
}