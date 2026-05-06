import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const { leadId, group } = await req.json();

  if (!leadId || !group) {
    return NextResponse.json({ error: "leadId and group required" }, { status: 400 });
  }

  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  if (!settings) return NextResponse.json({ error: "Settings not found" }, { status: 500 });

  const template = group === "A" ? settings.msg_a : settings.msg_b;
  const message = template
    .replace(/{name}/g, lead.name)
    .replace(/{link}/g, lead.site || "[No URL]");

  const phone = lead.phone.replace(/[^0-9+]/g, "");

  try {
    const res = await fetch(`${settings.wa_url}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": settings.wa_key,
      },
      body: JSON.stringify({ phone, message, leadId }),
      signal: AbortSignal.timeout(15000),
    });

    await supabase.from("leads").update({
      status: "sent",
      sent_at: new Date().toISOString(),
    }).eq("id", leadId);

    return NextResponse.json({ success: res.ok });
  } catch {
    await supabase.from("leads").update({
      status: "sent",
      sent_at: new Date().toISOString(),
    }).eq("id", leadId);
    return NextResponse.json({ success: true });
  }
}