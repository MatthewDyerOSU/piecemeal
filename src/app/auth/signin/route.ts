import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    const message =
      error?.message ?? "Could not start sign-in. Please try again.";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`,
      { status: 303 }
    );
  }

  return NextResponse.redirect(data.url, { status: 303 });
}
