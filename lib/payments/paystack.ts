type PaystackVerifyCustomer = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
};

export type PaystackVerifyData = {
  reference?: string;
  amount?: number;
  currency?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  customer?: PaystackVerifyCustomer;
};

export async function verifyPaystackReference(reference: string) {
  const normalizedReference = reference.trim();
  if (!normalizedReference) {
    throw new Error("Missing payment reference");
  }

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    throw new Error("Payment gateway not configured");
  }

  const TIMEOUT_MS = 10000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(normalizedReference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
        signal: controller.signal,
      },
    );
  } catch (fetchError: unknown) {
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw new Error("Payment gateway timed out. Please try again.");
    }
    throw new Error("Failed to reach payment gateway. Please try again.");
  } finally {
    clearTimeout(timeout);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Invalid response from payment gateway.");
  }

  const parsed = payload as {
    status?: boolean;
    message?: string;
    data?: PaystackVerifyData;
  };

  if (!response.ok || parsed.status === false) {
    throw new Error(parsed.message || "Payment verification failed");
  }

  if (!parsed.data) {
    throw new Error("Payment gateway did not return transaction details");
  }

  return parsed;
}
