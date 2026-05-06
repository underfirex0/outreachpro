import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const { leads, group } = await req.json();
  if (!Array.isArray(leads) || !leads.length) return NextResponse.json({ error: "leads array required" }, { status: 400 });
  const toInsert = leads.map((l: { name: string; phone: string; site: string }) => ({
    name: l.name?.trim(), phone: l.phone?.trim(), site: l.site?.trim() || "",
    group: group || "A", status: "unsent",
  })).filter((l: { name: string; phone: string }) => l.name && l.phone);
  const { data, error } = await supabase.from("leads").insert(toInsert).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ imported: data?.length ?? 0 });
}
