const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const TOKEN_KEY = "mbio_access";
const REFRESH_KEY = "mbio_refresh";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function getAccessTokenFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const accessToken = "accessToken" in body && typeof body.accessToken === "string"
    ? body.accessToken
    : null;

  if (accessToken) return accessToken;

  return "token" in body && typeof body.token === "string"
    ? body.token
    : null;
}

async function readResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function getErrorMessage(res: Response, body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    if ("error" in body && typeof body.error === "string") {
      return body.error;
    }

    if ("message" in body && typeof body.message === "string") {
      return body.message;
    }

    if ("raw" in body && typeof body.raw === "string" && body.raw.startsWith("<!DOCTYPE")) {
      return res.status >= 500
        ? "Server error. Please try again later."
        : fallback;
    }
  }

  return res.status >= 500 ? "Server error. Please try again later." : fallback;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    const data = await readResponseBody(res);
    const accessToken = getAccessTokenFromBody(data);

    if (!res.ok || !accessToken) {
      clearTokens();
      return null;
    }

    localStorage.setItem(TOKEN_KEY, accessToken);
    if (data && typeof data === "object" && "refreshToken" in data && typeof data.refreshToken === "string") {
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
    }
    return accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  let token = getAccessToken();

  const doFetch = (t: string | null) =>
    fetch(`${BASE}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(opts.headers ?? {}),
      },
    });

  let res = await doFetch(token);
  let body = await readResponseBody(res);

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
      body = await readResponseBody(res);
    }
  }

  if (!res.ok) {
    throw Object.assign(new Error(getErrorMessage(res, body, res.statusText || "Request failed")), {
      status: res.status,
      data: body,
    });
  }

  return body;
}

export interface AuthUser {
  id: number;
  uid: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  usernameSet: boolean;
  emailVerified: boolean;
  totpEnabled: boolean;
  createdAt: string;
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    return await apiFetch("/api/auth/me");
  } catch {
    return null;
  }
}

export interface SignupResult {
  requiresVerification: true;
  email: string;
}

export interface LoginResult {
  requiresTOTP?: true;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
}

export async function signup(email: string, username: string, password: string): Promise<SignupResult> {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  const body = await readResponseBody(res);
  if (!res.ok) throw new Error(getErrorMessage(res, body, "Signup failed"));
  return body as SignupResult;
}

export async function verifyEmail(email: string, code: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const body = await readResponseBody(res);
  if (!res.ok) throw new Error(getErrorMessage(res, body, "Verification failed"));

  const accessToken = getAccessTokenFromBody(body);
  const refreshToken = body && typeof body === "object" && "refreshToken" in body && typeof body.refreshToken === "string"
    ? body.refreshToken
    : null;
  const user = body && typeof body === "object" && "user" in body
    ? body.user as AuthUser
    : null;

  if (!accessToken || !refreshToken || !user) {
    throw new Error("Verification response was incomplete");
  }

  setTokens(accessToken, refreshToken);
  return user;
}

export async function resendVerification(email: string): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await readResponseBody(res);
  if (!res.ok) throw new Error(getErrorMessage(res, body, "Failed to resend code"));
}

export async function login(email: string, password: string, totpToken?: string): Promise<LoginResult> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, totpToken }),
  });
  const body = await readResponseBody(res);

  if (
    res.status === 403 &&
    body &&
    typeof body === "object" &&
    "requiresVerification" in body &&
    body.requiresVerification
  ) {
    throw Object.assign(new Error(getErrorMessage(res, body, "Email not verified")), {
      requiresVerification: true,
      email: "email" in body && typeof body.email === "string" ? body.email : email,
    });
  }

  if (!res.ok) throw new Error(getErrorMessage(res, body, "Login failed"));

  if (body && typeof body === "object" && "requiresTOTP" in body && body.requiresTOTP) {
    return {
      requiresTOTP: true,
      email: "email" in body && typeof body.email === "string" ? body.email : email,
    };
  }

  const accessToken = getAccessTokenFromBody(body);
  const refreshToken = body && typeof body === "object" && "refreshToken" in body && typeof body.refreshToken === "string"
    ? body.refreshToken
    : null;
  const user = body && typeof body === "object" && "user" in body
    ? body.user as AuthUser
    : null;

  if (!accessToken || !refreshToken || !user) {
    throw new Error("Login response was incomplete");
  }

  setTokens(accessToken, refreshToken);
  return { user };
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  clearTokens();
  await apiFetch("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
}

export async function setup2FA(): Promise<{ secret: string; qr: string; otpauthUrl: string }> {
  return apiFetch("/api/auth/2fa/setup");
}

export async function enable2FA(token: string): Promise<void> {
  await apiFetch("/api/auth/2fa/enable", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function disable2FA(password: string, token: string): Promise<void> {
  await apiFetch("/api/auth/2fa/disable", {
    method: "POST",
    body: JSON.stringify({ password, token }),
  });
}
