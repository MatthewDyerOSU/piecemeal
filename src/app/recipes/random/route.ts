import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { matchesTagFilters, sanitizeTagFilters } from "@/lib/recipes";

/**
 * Picks a random recipe from everything the user can see (their own and
 * their households'), optionally narrowed by the same tag filters as the
 * saved-recipes page (?filter=easy&filter=not-healthy), and redirects to
 * it. A plain GET so the button works without JavaScript; each click
 * picks again.
 */
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const filters = sanitizeTagFilters(searchParams.getAll("filter"));

  const { data } = await supabase.from("recipes").select("id, tags");
  const candidates = ((data as { id: string; tags: string[] }[]) ?? []).filter(
    (recipe) => matchesTagFilters(recipe.tags ?? [], filters)
  );

  if (candidates.length === 0) {
    const query = filters.map((f) => `&filter=${f}`).join("");
    return NextResponse.redirect(`${origin}/?picked=none${query}`);
  }

  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  return NextResponse.redirect(`${origin}/recipes/${choice.id}`);
}
