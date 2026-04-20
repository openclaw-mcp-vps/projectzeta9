import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const PAYWALL_COOKIE_NAME = "projectzeta9_paid";

export async function hasPaidAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(PAYWALL_COOKIE_NAME)?.value === "1";
}

export function requestHasPaidAccess(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader
    .split(";")
    .map((segment) => segment.trim())
    .some((segment) => segment === `${PAYWALL_COOKIE_NAME}=1`);
}

export function setPaidAccessCookie(response: NextResponse): void {
  response.cookies.set({
    name: PAYWALL_COOKIE_NAME,
    value: "1",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30
  });
}
