import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("user_roles").select("*").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const { email, password, role } = await req.json();
  if (!email || !password || !role) return NextResponse.json({ error: "email, password and role required" }, { status: 400 });

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  // Save role
  const { error: roleError } = await supabase.from("user_roles").insert({ email, role });
  if (roleError) return NextResponse.json({ error: roleError.message }, { status: 500 });

  return NextResponse.json({ success: true, user: authData.user });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServiceClient();
  const { email } = await req.json();
  const { error } = await supabase.from("user_roles").delete().eq("email", email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
