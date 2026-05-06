import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const { leadId, group } = await req.json();

  if (!leadId || !group) {
    return NextResponse.json({ error: "leadId and group required" }, { status: 400 });
  }

  // Get lead
  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Get settings
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  if (!settings) return NextResponse.json({ error: "Settings not found" }, { status: 500 });

  const template = group === "A" ? settings.msg_a : settings.msg_b;
  const message = template
    .replace(/{name}/g, lead.name)
    .replace(/{link}/g, lead.site || "[No URL]");

  const phone = lead.phone.replace(/[^0-9+]/g, "");

  try {
    // Call WA server server-side (no HTTPS restriction)
    const res = await fetch(`${settings.wa_url}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": settings.wa_key,
      },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(15000),
    });

    const ok = res.ok;

    // Update lead status
    await supabase.from("leads").update({
      status: "sent",
      sent_at: new Date().toISOString(),
    }).eq("id", leadId);

    if (ok) {
      return NextResponse.json({ success: true });
    } else {
      const err = await res.text();
      return NextResponse.json({ success: false, error: err });
    }
  } catch (e: any) {
    // Still mark as sent even if confirmation fails
    await supabase.from("leads").update({
      status: "sent",
      sent_at: new Date().toISOString(),
    }).eq("id", leadId);

    return NextResponse.json({ success: true, note: "Sent without confirmation" });
  }
}
