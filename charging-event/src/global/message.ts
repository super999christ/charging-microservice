export function getSuccessCompleteMessage(billingPlanId: number) {
  if (billingPlanId === 2) { // subscription plan
    return "Successfully completed charging. You are on the Subscription billing plan, transaction will not be charged to the credit card on file."; 
  }
  return "Successfully completed charging. Transaction will be charged to the credit card on file. Please remove the charge handle from the vehicle.";
}

export function getSuccessStopMessage(billingPlanId: number) {
  if (billingPlanId === 2) { // subscription plan
    return "Successfully stopped charging. You are on the Subscription billing plan, transaction will not be charged to the credit card on file.";
  }
  return "Successfully stopped charging. Transaction will be charged to the credit card on file. Please remove charge handle from the vehicle.";
}

export function getIOTErorMessage(billingPlanId: number) {
  if (billingPlanId === 2) { // subscription plan
    return "An error occurred before completing charge. You are on the Subscription billing plan, transaction will not be charged to the credit card on file. Please remove charge handle from the vehicle and retry charging.";
  }
  return "An error occurred before completing charge. Partial charging transaction will be charged to credit card on file. Please remove charge handle from the vehicle and retry charging.";
}

export function getNoPowerMessage()  {
  return "Vehicle is not requesting any power. Please remove charge handle from the vehicle and retry charging.";
}

export function getChargeStatusSystemErrorMessage() {
  return "System Error..please try again or call 480-573-2001 for support.";
}

export function getPromotionMessage(){
  return "Product Launch promotion: $1 per charging session. Only $1 will be charged to your credit card.";
}