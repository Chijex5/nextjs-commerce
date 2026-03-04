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
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    },
  );

  const payload = await response.json();
  return payload as {
    status?: boolean;
    message?: string;
    data?: PaystackVerifyData;
  };
}
