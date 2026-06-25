export interface CreateCheckoutInput {
  campaignId: string;
  amountInCents: number;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}
