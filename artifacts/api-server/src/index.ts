import app from "./app";
import { logger } from "./lib/logger";
import { startWalletWatcher } from "./lib/walletWatcher";
import { connectMongo } from "./lib/mongodb";

const rawPort = process.env["PORT"];
let port = 3000;

if (!rawPort) {
  logger.warn({ fallbackPort: port }, "PORT was not provided; falling back to the default port");
} else {
  const parsedPort = Number(rawPort);
  if (Number.isNaN(parsedPort) || parsedPort <= 0) {
    logger.warn({ rawPort, fallbackPort: port }, "Invalid PORT value provided; falling back to the default port");
  } else {
    port = parsedPort;
  }
}

// Connect to MongoDB (non-blocking — app starts regardless)
connectMongo().catch(() => {});

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  startWalletWatcher();
});

// ── Graceful shutdown — ensures port is released immediately on SIGTERM ────────
function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down gracefully…");
  server.close(() => {
    logger.info("All connections closed. Exiting.");
    process.exit(0);
  });

  // Force-kill if connections hang beyond 5s
  setTimeout(() => {
    logger.warn("Forced exit after 5s shutdown timeout");
    process.exit(1);
  }, 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
