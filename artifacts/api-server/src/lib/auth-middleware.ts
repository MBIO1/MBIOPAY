import type { Request, Response, NextFunction } from "express";
import { verifyAccess } from "./jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.id };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
