import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Picks a random recipe from everything the user can see (their own and
 * their households') and redirects to it. A plain GET so the homepage
 * button works without JavaScript; each click picks again.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data } = await supabase.from("recipes").select("id");
  const ids = (data as { id: string }[] | null) ?? [];

  if (ids.length === 0) {
    return NextResponse.redirect(`${origin}/?picked=none`);
  }

  const choice = ids[Math.floor(Math.random() * ids.length)];
  return NextResponse.redirect(`${origin}/recipes/${choice.id}`);
}
