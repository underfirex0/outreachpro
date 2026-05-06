import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

function normalizePhone(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (p.startsWith("0") && !p.startsWith("00")) p = "+212" + p.slice(1);
  if (p.startsWith("212") && !p.startsWith("+")) p = "+" + p;
  return p;
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const { leads, group } = await req.json();
  if (!Array.isArray(leads) || !leads.length) {
    return NextResponse.json({ error: "leads array required" }, { status: 400 });
  }
  const toInsert = leads.map((l: { name: string; phone: string; site: string }) => ({
    name: l.name?.trim(),
    phone: normalizePhone(l.phone?.trim() || ""),
    site: l.site?.trim() || "",
    group: group || "A",
    status: "unsent",
  })).filter((l: { name: string; phone: string }) => l.name && l.phone);

  const { data, error } = await supabase.from("leads").insert(toInsert).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ imported: data?.length ?? 0 });
}
