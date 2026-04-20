import { createHmac } from "node:crypto";

import { cookies } from "next/headers";

const ACCESS_COOKIE = "pz9_access";
const TOKEN_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? "development-secret";

type TokenPurpose = "checkout" | "access";

interface TokenPayload {
  purpose: TokenPurpose;
  email: string;
  exp: number;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: TokenPayload): string {
  const payloadPart = encodeBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", TOKEN_SECRET)
    .update(payloadPart)
    .digest("base64url");
  return `${payloadPart}.${signature}`;
}

function verifySignedPayload(token: string): TokenPayload | null {
  const [payloadPart, signature] = token.split(".");

  if (!payloadPart || !signature) {
    return null;
  }

  const expected = createHmac("sha256", TOKEN_SECRET)
    .update(payloadPart)
    .digest("base64url");

  if (signature !== expected) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(payloadPart)) as TokenPayload;

    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createCheckoutToken(email: string): string {
  return signPayload({
    purpose: "checkout",
    email,
    exp: Date.now() + 1000 * 60 * 60 * 6,
  });
}

export function createAccessToken(email: string): string {
  return signPayload({
    purpose: "access",
    email,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
  });
}

export function verifyCheckoutToken(token: string): { email: string } | null {
  const payload = verifySignedPayload(token);
  if (!payload || payload.purpose !== "checkout") {
    return null;
  }

  return { email: payload.email };
}

export function verifyAccessToken(token: string): { email: string } | null {
  const payload = verifySignedPayload(token);
  if (!payload || payload.purpose !== "access") {
    return null;
  }

  return { email: payload.email };
}

export async function hasPaidAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!token) {
    return false;
  }

  return Boolean(verifyAccessToken(token));
}

export function getAccessCookieName(): string {
  return ACCESS_COOKIE;
}

export function buildAccessCookieOptions(): {
  name: string;
  value: string;
  path: string;
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  maxAge: number;
} {
  return {
    name: ACCESS_COOKIE,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  };
}
