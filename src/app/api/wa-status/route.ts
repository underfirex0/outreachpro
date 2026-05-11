import { NextResponse } from "next/server";

const META_API = "https://graph.facebook.com/v19.0";

export async function GET() {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return NextResponse.json({ status: "disconnected", connected: false });
  }

  try {
    const res = await fetch(`${META_API}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json({ status: "disconnected", connected: false, error: data.error?.message });
    }

    return NextResponse.json({
      status: "connected",
      connected: true,
      phone: data.display_phone_number,
      name: data.verified_name,
      quality: data.quality_rating,
    });
  } catch {
    return NextResponse.json({ status: "disconnected", connected: false });
  }
}
