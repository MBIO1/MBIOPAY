import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET ?? (process.env.NODE_ENV === "production" ? (() => { throw new Error("JWT_SECRET env var is required in production"); })() : "mbio-access-secret-dev");
const REFRESH_SECRET = process.env.REFRESH_SECRET ?? (process.env.NODE_ENV === "production" ? (() => { throw new Error("REFRESH_SECRET env var is required in production"); })() : "mbio-refresh-secret-dev");

export interface JwtPayload {
  id: number;
}

export function signAccess(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefresh(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccess(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefresh(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
