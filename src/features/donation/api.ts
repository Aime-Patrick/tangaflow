import type { CreateCheckoutInput, CheckoutResponse } from "./types";

export async function createCheckout(input: CreateCheckoutInput): Promise<CheckoutResponse> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create checkout");
  return res.json();
}
