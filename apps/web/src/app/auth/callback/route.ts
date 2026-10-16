import { NextResponse } from "next/server";
import { serverAuth } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const client = await serverAuth();
  if (code && client) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/portal", url.origin));
  }
  return NextResponse.redirect(
    new URL("/login?error=confirmation", url.origin),
  );
}
