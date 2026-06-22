import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Redirect back to home on the same origin the request came from.
  return NextResponse.redirect(new URL("/", request.url));
}
