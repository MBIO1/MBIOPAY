import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    isAdmin?: boolean;
    adminId?: number;
    adminEmail?: string;
    totpPending?: boolean;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}

export {};
