import axios from "axios";
import { logger } from "./logger";

// PawaPay API Configuration
const PAWAPAY_API_URL = process.env.PAWAPAY_API_URL ?? "https://api.pawapay.io";
const PAWAPAY_API_KEY = process.env.PAWAPAY_API_KEY ?? "";
const PAWAPAY_API_SECRET = process.env.PAWAPAY_API_SECRET ?? "";
const PAWAPAY_MERCHANT_ID = process.env.PAWAPAY_MERCHANT_ID ?? "";

const isPawaPayConfigured = PAWAPAY_API_KEY && PAWAPAY_API_SECRET && PAWAPAY_MERCHANT_ID;

// PawaPay network codes for Uganda
const PAWAPAY_NETWORK_CODES: Record<string, string> = {
  MTN: "MTN_UGANDA",
  Airtel: "AIRTEL_UGANDA",
};

interface PawaPayPayoutRequest {
  payoutId: string;
  phoneNumber: string;
  amount: string;
  currency: string;
  correspondent: string;
  statementDescription: string;
  country: string;
  recipient: {
    name: string;
    type: "MSISDN";
    address?: {
      country?: string;
    };
  };
}

interface PawaPayPayoutResponse {
  payoutId: string;
  status: string;
  amount: string;
  currency: string;
  correspondent: string;
  phoneNumber: string;
  created: string;
  receivedByRecipient?: string;
  correspondentTransactionId?: string;
}

/**
 * Check if PawaPay is properly configured
 */
export function isPawaPayEnabled(): boolean {
  return isPawaPayConfigured;
}

/**
 * Get PawaPay balance
 */
export async function getPawaPayBalance(): Promise<{ currency: string; balance: number } | null> {
  if (!isPawaPayConfigured) {
    return null;
  }

  try {
    const response = await axios.get(
      `${PAWAPAY_API_URL}/merchant/v1/balances`,
      {
        headers: {
          "Authorization": `Bearer ${PAWAPAY_API_KEY}`,
          "X-Api-Secret": PAWAPAY_API_SECRET,
          "X-Merchant-Id": PAWAPAY_MERCHANT_ID,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    // Find UGX balance
    const balances = response.data?.balances || [];
    const ugxBalance = balances.find((b: any) => b.currency === "UGX");
    
    return {
      currency: "UGX",
      balance: ugxBalance?.available || 0,
    };
  } catch (err) {
    logger.warn({ err }, "Could not fetch PawaPay balance");
    return null;
  }
}

/**
 * Execute payout via PawaPay
 */
export async function executePawaPayPayout(
  orderId: number,
  phone: string,
  network: string,
  amountUGX: number,
  recipientName: string
): Promise<{ success: boolean; payoutId?: string; error?: string }> {
  if (!isPawaPayConfigured) {
    return { success: false, error: "PawaPay not configured" };
  }

  const correspondent = PAWAPAY_NETWORK_CODES[network];
  if (!correspondent) {
    return { success: false, error: `Unsupported network: ${network}` };
  }

  const payoutId = `mbio-${orderId}-${Date.now()}`;

  const payload: PawaPayPayoutRequest = {
    payoutId,
    phoneNumber: phone,
    amount: amountUGX.toString(),
    currency: "UGX",
    correspondent,
    statementDescription: "MBIO PAY Remittance",
    country: "UGA",
    recipient: {
      name: recipientName || "MBIO Customer",
      type: "MSISDN",
      address: {
        country: "UGA",
      },
    },
  };

  try {
    const response = await axios.post(
      `${PAWAPAY_API_URL}/merchant/v1/payouts`,
      payload,
      {
        headers: {
          "Authorization": `Bearer ${PAWAPAY_API_KEY}`,
          "X-Api-Secret": PAWAPAY_API_SECRET,
          "X-Merchant-Id": PAWAPAY_MERCHANT_ID,
          "Content-Type": "application/json",
          "Idempotency-Key": payoutId,
        },
        timeout: 30000,
      }
    );

    const data: PawaPayPayoutResponse = response.data;
    
    logger.info(
      { orderId, payoutId, status: data.status, amount: amountUGX },
      "PawaPay payout initiated"
    );

    return {
      success: true,
      payoutId: data.payoutId,
    };
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
    
    logger.error(
      { orderId, error: message, responseData },
      "PawaPay payout failed"
    );

    return {
      success: false,
      error: responseData?.message || message,
    };
  }
}

/**
 * Check payout status
 */
export async function getPawaPayPayoutStatus(payoutId: string): Promise<string | null> {
  if (!isPawaPayConfigured) {
    return null;
  }

  try {
    const response = await axios.get(
      `${PAWAPAY_API_URL}/merchant/v1/payouts/${payoutId}`,
      {
        headers: {
          "Authorization": `Bearer ${PAWAPAY_API_KEY}`,
          "X-Api-Secret": PAWAPAY_API_SECRET,
          "X-Merchant-Id": PAWAPAY_MERCHANT_ID,
        },
        timeout: 10000,
      }
    );

    return response.data?.status || null;
  } catch (err) {
    logger.warn({ payoutId, err }, "Could not fetch PawaPay payout status");
    return null;
  }
}

/**
 * Validate phone number with PawaPay
 */
export async function validatePawaPayPhone(phone: string, network: string): Promise<{ valid: boolean; name?: string }> {
  if (!isPawaPayConfigured) {
    return { valid: false };
  }

  const correspondent = PAWAPAY_NETWORK_CODES[network];
  if (!correspondent) {
    return { valid: false };
  }

  try {
    const response = await axios.post(
      `${PAWAPAY_API_URL}/merchant/v1/validate`,
      {
        phoneNumber: phone,
        correspondent,
      },
      {
        headers: {
          "Authorization": `Bearer ${PAWAPAY_API_KEY}`,
          "X-Api-Secret": PAWAPAY_API_SECRET,
          "X-Merchant-Id": PAWAPAY_MERCHANT_ID,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return {
      valid: response.data?.valid || false,
      name: response.data?.name,
    };
  } catch (err) {
    logger.warn({ phone, network, err }, "PawaPay phone validation failed");
    return { valid: false };
  }
}
