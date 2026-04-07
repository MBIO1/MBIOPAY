import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import pinoHttp from "pino-http";
import session from "express-session";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { visitTracker } from "./routes/tracking";
import { logger } from "./lib/logger";
import { createHash } from "crypto";

const app: Express = express();

app.set("trust proxy", 1);

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
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "https://accounts.google.com"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", "data:", "https:"],
        connectSrc:  ["'self'", "https://api.mbiopay.com"],
        fontSrc:     ["'self'"],
        objectSrc:   ["'none'"],
        frameSrc:    ["https://accounts.google.com"],
        upgradeInsecureRequests: [],
      },
    },
    frameguard:     { action: "sameorigin" },
    hsts:           { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

app.use((_req, res, next) => {
  // Allow Google Sign-In popup to communicate back — "same-origin" blocks it
  res.setHeader("Cross-Origin-Opener-Policy",   "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  // Explicit nosniff (belt-and-suspenders on top of helmet)
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Disable sensors not needed by this app
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.get("/.well-known/security.txt", (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(
    "Contact: mailto:support@mbiopay.com\n" +
    "Expires: 2027-01-01T00:00:00.000Z\n" +
    "Preferred-Languages: en\n",
  );
});

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  const replitDomains = process.env.REPLIT_DOMAINS?.split(",") ?? [];
  replitDomains.forEach((d) => origins.add(`https://${d.trim()}`));

  if (process.env.REPLIT_DEV_DOMAIN) {
    origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
  }

  // Production custom domains
  origins.add("https://mbiopay.com");
  origins.add("https://www.mbiopay.com");
  origins.add("https://app.mbiopay.com");
  origins.add("https://admin.mbiopay.com");
  origins.add("https://api.mbiopay.com");

  const envOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? [];
  envOrigins
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => origins.add(origin));

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://localhost:5173");
    origins.add("http://localhost:21568");
  }

  return origins;
}

const allowedOrigins = buildAllowedOrigins();

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;

  try {
    const parsed = new URL(origin);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname.endsWith(".onrender.com") ||
        parsed.hostname.endsWith(".render.com"))
    );
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-secret"],
  }),
);

const sessionStore = (() => {
  if (process.env.NODE_ENV === "production") {
    console.warn("[session] MemoryStore in use — set REDIS_URL to enable Redis session store");
  }
  return undefined; // MemoryStore default
})();

app.use(
  session({
    store: sessionStore,
    secret: process.env.ADMIN_SECRET ?? "mbio-admin-fallback-secret",
    resave: false,
    saveUninitialized: false,
    name: "mbio_admin_sid",
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 4 * 60 * 60 * 1000, // 4 hours
    },
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
    const clientIp = req.ip ?? req.socket?.remoteAddress ?? "127.0.0.1";
    const baseIp = ipKeyGenerator(clientIp);
    const ua = req.headers["user-agent"] ?? "";
    return createHash("sha256").update(baseIp + ua).digest("hex");
  },
});

app.use("/api/profile", express.json({ limit: "4mb" }));
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use("/api", globalLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/signup", loginLimiter);
app.use("/api/auth/google", loginLimiter);

const refreshLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false });
app.use("/api/auth/refresh", refreshLimiter);

// Visit tracking (MongoDB, non-blocking)
app.use("/api", visitTracker);

app.use("/api", router);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const isApiRequest = req.path.startsWith("/api");
  if (!isApiRequest) {
    next(err);
    return;
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  const status =
    typeof err === "object" && err !== null && "status" in err && typeof (err as { status?: unknown }).status === "number"
      ? ((err as { status: number }).status)
      : message.includes("DATABASE_URL is not configured")
        ? 503
        : 500;

  logger.error({ err, status, path: req.path, method: req.method }, "API request failed");

  if (status === 503) {
    res.status(503).json({
      error: "Database is not configured. Authentication and dashboard features are temporarily unavailable.",
    });
    return;
  }

  res.status(status).json({
    error: status >= 500 ? `Internal Server Error: ${message}` : message,
  });
});

const runtimeDir = dirname(fileURLToPath(import.meta.url));
const remittanceUiDist = join(runtimeDir, "../../remittance-ui/dist/public");

if (existsSync(remittanceUiDist)) {
  app.use(express.static(remittanceUiDist));

  // Serve the remittance SPA from the same origin as the API.
  app.get(/^\/(?!api(?:\/|$)|\.well-known(?:\/|$)).*/, (_req, res) => {
    res.sendFile(join(remittanceUiDist, "index.html"));
  });
} else {
  logger.warn({ path: remittanceUiDist }, "Remittance UI build output not found; root route will not be served");
}

export default app;
export { loginLimiter };
