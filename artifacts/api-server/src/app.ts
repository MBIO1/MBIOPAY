import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, slow down." },
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, try again in a minute." },
  keyGenerator: (req) => {
    const ip = req.ip ?? "unknown";
    const ua = req.headers["user-agent"] ?? "";
    const crypto = require("crypto") as typeof import("crypto");
    return crypto.createHash("sha256").update(ip + ua).digest("hex");
  },
});

app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", globalLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/signup", loginLimiter);

app.use("/api", router);

export default app;
export { loginLimiter };
