import axios from "axios";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TRONGRID_BASE = "https://api.trongrid.io";
const UGX_RATE = 3700;

let lastTx = "";
let watching = false;

interface Trc20Tx {
  transaction_id: string;
  to: string;
  value: string;
  token_info?: { decimals?: number };
}

function resolveTronApiKey(tronApiEnv: string): string {
  if (!tronApiEnv) return "";
  if (tronApiEnv.startsWith("http")) {
    return "";
  }
  return tronApiEnv;
}

async function fetchTrc20Transactions(walletAddress: string, tronApiEnv: string): Promise<Trc20Tx[]> {
  const apiKey = resolveTronApiKey(tronApiEnv);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["TRON-PRO-API-KEY"] = apiKey;

  const endpoint = `${TRONGRID_BASE}/v1/accounts/${walletAddress}/transactions/trc20`;

  logger.info({ endpoint, hasApiKey: !!apiKey }, "Polling TRON wallet");

  const res = await axios.get(endpoint, {
    params: { limit: 20, contract_address: USDT_CONTRACT, only_to: "true" },
    headers,
    timeout: 15000,
  });

  return (res.data?.data ?? []) as Trc20Tx[];
}

async function executePayout(orderId: number, phone: string, network: string, amount: number) {
  const ugx = Math.floor(amount * UGX_RATE);
  const flwNetwork = network === "MTN" ? "MPS" : "AIN";

  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/transfers",
      {
        account_bank: flwNetwork,
        account_number: phone,
        amount: ugx,
        currency: "UGX",
        narration: "Crypto Remittance Payout",
        reference: `order-${orderId}-${Date.now()}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    logger.info({ orderId, flwResponse: response.data?.status }, "Flutterwave response");

    await db
      .update(ordersTable)
      .set({ status: "completed", ugxAmount: ugx, updatedAt: new Date() })
      .where(eq(ordersTable.id, orderId));

    logger.info({ orderId, ugx, phone, network }, "Payout completed");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
    logger.error({ orderId, error: message, responseData }, "Payout failed");

    await db
      .update(ordersTable)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(ordersTable.id, orderId));
  }
}

async function watchWallet() {
  if (watching) return;
  watching = true;

  try {
    const walletAddress = process.env.WALLET_ADDRESS;
    const tronApi = process.env.TRON_API ?? "";

    if (!walletAddress) {
      logger.warn("WALLET_ADDRESS not set, skipping wallet watch");
      watching = false;
      return;
    }

    const txs = await fetchTrc20Transactions(walletAddress, tronApi);

    for (const tx of txs) {
      if (tx.transaction_id === lastTx) break;

      if (tx.to === walletAddress) {
        const decimals = tx.token_info?.decimals ?? 6;
        const amount = parseInt(tx.value, 10) / Math.pow(10, decimals);

        logger.info({ txid: tx.transaction_id, amount }, "Incoming USDT detected");

        const waitingOrders = await db
          .select()
          .from(ordersTable)
          .where(eq(ordersTable.status, "waiting"))
          .limit(1);

        const order = waitingOrders[0];

        if (order) {
          await db
            .update(ordersTable)
            .set({
              status: "processing",
              amount,
              txid: tx.transaction_id,
              updatedAt: new Date(),
            })
            .where(eq(ordersTable.id, order.id));

          await executePayout(order.id, order.phone, order.network, amount);
        } else {
          logger.warn({ txid: tx.transaction_id, amount }, "No waiting order for incoming tx");
        }
      }
    }

    if (txs.length > 0 && txs[0]) {
      lastTx = txs[0].transaction_id;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ error: message }, "Wallet watcher error");
  } finally {
    watching = false;
  }
}

export function startWalletWatcher() {
  logger.info("Wallet watcher started (polling every 15s)");
  watchWallet();
  setInterval(watchWallet, 15000);
}
