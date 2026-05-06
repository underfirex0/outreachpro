import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (group) query = query.eq("group", group);
  if (status) query = query.eq("status", status);
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const { name, phone, site, group } = await req.json();
  if (!name || !phone) return NextResponse.json({ error: "name and phone required" }, { status: 400 });
  const { data, error } = await supabase.from("leads").insert({ name, phone, site: site || "", group: group || "A" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
