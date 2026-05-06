import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServiceClient();
  const { data: leads } = await supabase.from("leads").select("group, status, sent_at, replied_at");
  if (!leads) return NextResponse.json({});
  const total = leads.length;
  const sent = leads.filter(l => l.sent_at).length;
  const replied = leads.filter(l => ["replied","interested","not-interested","not-sure"].includes(l.status)).length;
  const interested = leads.filter(l => l.status === "interested").length;
  const sentA = leads.filter(l => l.group === "A" && l.sent_at).length;
  const sentB = leads.filter(l => l.group === "B" && l.sent_at).length;
  const repliedA = leads.filter(l => l.group === "A" && ["replied","interested","not-interested","not-sure"].includes(l.status)).length;
  const repliedB = leads.filter(l => l.group === "B" && ["replied","interested","not-interested","not-sure"].includes(l.status)).length;
  const intA = leads.filter(l => l.group === "A" && l.status === "interested").length;
  const intB = leads.filter(l => l.group === "B" && l.status === "interested").length;
  return NextResponse.json({
    total, sent, replied, interested,
    replyRate: sent ? Math.round(replied/sent*100) : 0,
    convRate: sent ? Math.round(interested/sent*100) : 0,
    a: { sent: sentA, replied: repliedA, interested: intA, replyRate: sentA ? Math.round(repliedA/sentA*100) : 0, convRate: sentA ? Math.round(intA/sentA*100) : 0 },
    b: { sent: sentB, replied: repliedB, interested: intB, replyRate: sentB ? Math.round(repliedB/sentB*100) : 0, convRate: sentB ? Math.round(intB/sentB*100) : 0 },
  });
}
