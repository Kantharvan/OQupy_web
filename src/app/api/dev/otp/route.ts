import { execSync } from "child_process";
import { NextRequest, NextResponse } from "next/server";

// Dev-only endpoint — reads OTP directly from Railway Redis.
// Remove before production or ensure NODE_ENV=production disables it.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return NextResponse.json({ error: "REDIS_URL not set" }, { status: 500 });
  }

  try {
    const otp = execSync(
      `redis-cli -u "${redisUrl}" get "otp:${phone}"`,
      { timeout: 5000 }
    ).toString().trim();

    if (!otp) {
      return NextResponse.json({ otp: null }, { status: 200 });
    }
    return NextResponse.json({ otp });
  } catch {
    return NextResponse.json({ error: "Redis read failed" }, { status: 500 });
  }
}
