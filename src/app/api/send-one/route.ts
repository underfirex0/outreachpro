import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const META_API = "https://graph.facebook.com/v19.0";

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

  const phone = lead.phone.replace(/[^0-9]/g, "");

  const accessToken = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return NextResponse.json({ error: "Meta API credentials not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${META_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "text",
        text: { body: message },
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[META SEND ERROR]", JSON.stringify(data));
      return NextResponse.json({ error: data.error?.message || "Send failed" }, { status: 500 });
    }

    // Save the WhatsApp message ID and update lead status
    const waMessageId = data.messages?.[0]?.id;
    await supabase.from("leads").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      ...(waMessageId && { phone: phone }),
    }).eq("id", leadId);

    return NextResponse.json({ success: true, messageId: waMessageId });
  } catch (err: any) {
    console.error("[META SEND EXCEPTION]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
