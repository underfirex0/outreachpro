import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("settings").select("wa_url,wa_key").eq("id", 1).single();
  if (!data) return NextResponse.json({ status: "disconnected" });
  try {
    const res = await fetch(`${data.wa_url}/status?key=${data.wa_key}`, { signal: AbortSignal.timeout(5000) });
    return NextResponse.json(await res.json());
  } catch { return NextResponse.json({ status: "disconnected" }); }
}
