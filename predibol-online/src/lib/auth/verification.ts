import { cookies } from "next/headers";

const COOKIE_NAME = "predibol_verified";

/**
 * Returns today's date string in Bolivia time (UTC-4).
 * Used as the cookie value to validate the verification is from today.
 */
function todayBolivia(): string {
  const now = new Date();
  const boliviaOffset = -4 * 60; // UTC-4 in minutes
  const localOffset = now.getTimezoneOffset();
  const boliviaTime = new Date(now.getTime() + (boliviaOffset - localOffset) * 60000);
  return boliviaTime.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/**
 * Returns the Date at which the verification cookie should expire:
 * midnight of the NEXT day in Bolivia time (UTC-4).
 */
function midnightBoliviaTomorrow(): Date {
  const now = new Date();
  const boliviaOffset = -4 * 60;
  const localOffset = now.getTimezoneOffset();
  const boliviaTime = new Date(now.getTime() + (boliviaOffset - localOffset) * 60000);

  // Set to midnight of today in Bolivia, then add 1 day for tomorrow midnight
  const midnight = new Date(
    Date.UTC(
      boliviaTime.getUTCFullYear(),
      boliviaTime.getUTCMonth(),
      boliviaTime.getUTCDate() + 1, // tomorrow
      4, // 00:00 UTC-4 = 04:00 UTC
      0,
      0,
      0,
    ),
  );

  return midnight;
}

/**
 * Sets the verification cookie indicating the user passed
 * whitelist + payment checks today. Expires at midnight Bolivia time.
 */
export async function setVerificationCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, todayBolivia(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: midnightBoliviaTomorrow(),
  });
}

/**
 * Returns true if the verification cookie exists AND its value
 * matches today's date in Bolivia time (i.e., was set today).
 */
export async function isVerifiedToday(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return false;
  return cookie.value === todayBolivia();
}
