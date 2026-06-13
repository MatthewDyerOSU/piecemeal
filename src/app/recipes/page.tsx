import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/types/recipe";
import { matchesTagFilters, sanitizeTagFilters } from "@/lib/recipes";
import TagPills from "@/components/TagPills";

export const metadata: Metadata = {
  title: "Saved recipes",
};

function toArray(value: string | string[] | undefined): string[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[] }>;
}) {
  const params = await searchParams;
  const filters = sanitizeTagFilters(toArray(params.filter));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase.from("recipes").select("*");

  const recipes = ((data as Recipe[]) ?? [])
    .filter((recipe) => matchesTagFilters(recipe.tags ?? [], filters))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );

  // Household shares for the visible recipes. `households(name)` is null
  // for households the viewer isn't in (RLS hides the name), so each
  // recipe gets the names it can show plus a count of any it can't.
  const shareByRecipe = new Map<
    string,
    { names: string[]; total: number }
  >();
  if (recipes.length > 0) {
    const { data: shareData } = await supabase
      .from("recipe_households")
      .select("recipe_id, households(name)")
      .in(
        "recipe_id",
        recipes.map((r) => r.id)
      );
    for (const row of (shareData as
      | { recipe_id: string; households: { name: string } | null }[]
      | null) ?? []) {
      const entry = shareByRecipe.get(row.recipe_id) ?? {
        names: [],
        total: 0,
      };
      entry.total += 1;
      if (row.households?.name) {
        entry.names.push(row.households.name);
      }
      shareByRecipe.set(row.recipe_id, entry);
    }
  }

  // Owner display names come from household membership (the only place
  // names are visible to the viewer); your own recipes show "You".
  const nameByUser = new Map<string, string>();
  if (recipes.length > 0) {
    const { data: memberData } = await supabase
      .from("household_members")
      .select("user_id, display_name");
    for (const m of (memberData as
      | { user_id: string; display_name: string }[]
      | null) ?? []) {
      if (m.display_name && !nameByUser.has(m.user_id)) {
        nameByUser.set(m.user_id, m.display_name);
      }
    }
  }

  const currentUserId = user.id;
  function ownerLabel(recipe: Recipe): string {
    return recipe.user_id === currentUserId
      ? "You"
      : nameByUser.get(recipe.user_id) ?? "A household member";
  }

  function shareSummary(recipeId: string): string | null {
    const entry = shareByRecipe.get(recipeId);
    if (!entry || entry.total === 0) {
      return null;
    }
    const shown = entry.names.slice(0, 2);
    const remaining = entry.total - shown.length;
    const parts = [...shown];
    if (remaining > 0) {
      parts.push(`+${remaining}`);
    }
    return parts.join(", ");
  }

  return (
    <>
      <h1>Saved recipes</h1>

      <section aria-labelledby="filter-heading" className="filter-section">
        <h2 className="eyebrow" id="filter-heading">
          Filter
        </h2>
        <form method="get" action="/recipes" className="filter-form">
          {/* Keyed on the active filters so the uncontrolled checkboxes
              remount and re-apply their defaults after a client-side
              navigation such as "Clear filters" (defaultChecked does not
              update on re-render alone). */}
          <TagPills
            key={filters.join(",")}
            name="filter"
            legend="Filter by tag"
            defaultSelected={filters}
          />
          <div className="filter-actions">
            <button type="submit" className="button button-secondary">
              Apply filters
            </button>
            {filters.length > 0 ? (
              <Link href="/recipes">Clear filters</Link>
            ) : null}
          </div>
        </form>
      </section>

      {error ? (
        <p role="alert" className="alert alert-error">
          Could not load your recipes: {error.message}
        </p>
      ) : recipes.length === 0 ? (
        <p>
          {filters.length > 0 ? (
            <>No recipes match these filters.</>
          ) : (
            <>
              You have no saved recipes yet.{" "}
              <Link href="/recipes/new">Add your first recipe</Link>.
            </>
          )}
        </p>
      ) : (
        <ul className="recipe-grid">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <article className="card recipe-card">
                <h2>
                  <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>
                </h2>
                <div className="recipe-card-tags">
                  {(recipe.tags ?? []).length > 0 ? (
                    <ul className="tag-list">
                      {recipe.tags.map((tag) => (
                        <li className={`tag-pill pill-${tag}`} key={tag}>
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <p className="recipe-meta-line">
                  <span className="recipe-meta-key">By</span>{" "}
                  {ownerLabel(recipe)}
                </p>
                {shareSummary(recipe.id) ? (
                  <p className="recipe-meta-line">
                    <span className="recipe-meta-key">Shared with</span>{" "}
                    {shareSummary(recipe.id)}
                  </p>
                ) : null}
                <div className="recipe-card-actions">
                  <Link
                    className="button button-secondary"
                    href={`/recipes/${recipe.id}/edit`}
                  >
                    {recipe.user_id === currentUserId
                      ? "Edit"
                      : "Manage sharing"}
                    <span className="visually-hidden"> {recipe.name}</span>
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
