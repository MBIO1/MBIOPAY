import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET ?? "mbio-access-secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET ?? "mbio-refresh-secret";

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
