import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // The provider redirected back without a code, e.g. the user cancelled
  // the Google prompt or the OAuth configuration is wrong.
  const description =
    searchParams.get("error_description") ??
    "Sign-in was cancelled or did not complete.";
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(description)}`
  );
}
