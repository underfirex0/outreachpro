import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const CLAUDE_API = "https://api.anthropic.com/v1/messages";
const META_API = "https://graph.facebook.com/v19.0";

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "outreachpro-webhook-secret";

// Status mapping
function mapStatus(botStatus: string): string {
  const map: Record<string, string> = {
    cold: "not-interested",
    warm: "replied",
    hot: "interested",
    booked: "interested",
    human_takeover: "replied",
  };
  return map[botStatus] || "replied";
}

// GET — webhook verification by Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST — incoming messages from Meta
export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();

  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages) return NextResponse.json({ status: "ok" });

    const msg = value.messages[0];
    if (msg.type !== "text") return NextResponse.json({ status: "ok" });

    const fromPhone = msg.from; // e.g. "212661234567"
    const messageText = msg.text.body;

    // Find lead by phone (last 9 digits matching)
    const last9 = fromPhone.slice(-9);
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .ilike("phone", `%${last9}`);

    const lead = leads?.[0];

    // Save message to conversations
    await supabase.from("conversations").insert({
      phone: fromPhone,
      role: "user",
      message: messageText,
    });

    // Get conversation history
    const { data: history } = await supabase
      .from("conversations")
      .select("role, message")
      .eq("phone", fromPhone)
      .order("created_at", { ascending: true })
      .limit(8);

    // Build messages for Claude
    const messages = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.message,
    }));

    // Get Claude response
    const claudeRes = await fetch(CLAUDE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: `Tu es un commercial WhatsApp de BuildFactory Maroc. On a déjà envoyé au client un site web créé spécifiquement pour lui.

CRITICAL RULE - LANGUAGE: You MUST respond in French ONLY. No exceptions. No Darija. No Arabic. No mixing. Pure French always.

YOUR ONLY GOAL: Qualify interest quickly and redirect to a human call. Max 2 short sentences.

RULES:
- Always French only
- Max 2 sentences  
- Never lists or bullet points
- Never repeat what was in the initial message

RESPONSES:
- Any greeting → "Bonjour! Vous avez vu le site qu'on a créé pour vous? Qu'en pensez-vous?"
- Any interest shown → "Super! Un conseiller va vous appeler dans quelques minutes pour tout personnaliser. 🙏" [STATUS:hot]
- Price question → "990 DH une seule fois, tout inclus. Un conseiller vous appelle maintenant. 🙏" [STATUS:hot]
- Not interested → "Pas de souci, bonne continuation! 🙏" [STATUS:cold]
- Complex question → [STATUS:human_takeover]

ALWAYS end with [STATUS:cold|warm|hot|booked|human_takeover]

${lead ? `Lead info: ${lead.name}, ${lead.site || "no site"}` : ""}`,
        messages,
      }),
    });

    const claudeData = await claudeRes.json();
    const replyText = claudeData.content?.[0]?.text || "Bonjour! Qu'en pensez-vous du site?";

    // Extract status
    const statusMatch = replyText.match(/\[STATUS:(cold|warm|hot|booked|human_takeover)\]/);
    const botStatus = statusMatch?.[1] || "warm";
    const cleanReply = replyText.replace(/\[STATUS:[^\]]+\]/, "").trim();

    // Save bot reply to conversations
    await supabase.from("conversations").insert({
      phone: fromPhone,
      role: "assistant",
      message: cleanReply,
    });

    // Update lead status in CRM
    if (lead) {
      await supabase.from("leads").update({
        status: mapStatus(botStatus),
        replied_at: new Date().toISOString(),
      }).eq("id", lead.id);
    }

    // Send reply via Meta API
    const accessToken = process.env.META_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

    if (accessToken && phoneNumberId) {
      await fetch(`${META_API}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: fromPhone,
          type: "text",
          text: { body: cleanReply },
        }),
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("[WEBHOOK ERROR]", err.message);
    return NextResponse.json({ status: "ok" });
  }
}
