import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/types/recipe";
import { matchesTagFilters, sanitizeTagFilters } from "@/lib/recipes";
import DeleteRecipeButton from "@/components/DeleteRecipeButton";
import { deleteRecipe } from "./actions";

export const metadata: Metadata = {
  title: "Saved recipes",
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "healthy", label: "Healthy" },
  { value: "quick", label: "Quick" },
  { value: "easy", label: "Easy" },
  { value: "not-healthy", label: "Not healthy" },
  { value: "not-quick", label: "Not quick" },
  { value: "not-easy", label: "Not easy" },
];

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

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  const recipes = ((data as Recipe[]) ?? []).filter((recipe) =>
    matchesTagFilters(recipe.tags ?? [], filters)
  );

  return (
    <>
      <h1>Saved recipes</h1>

      <section aria-labelledby="filter-heading" className="filter-section">
        <h2 className="eyebrow" id="filter-heading">
          Filter
        </h2>
        <form method="get" action="/recipes" className="filter-form">
          <fieldset>
            <legend className="visually-hidden">Filter by tag</legend>
            <div className="checkbox-list">
              {FILTER_OPTIONS.map((option) => (
                <label key={option.value} className="checkbox-option">
                  <input
                    type="checkbox"
                    name="filter"
                    value={option.value}
                    defaultChecked={filters.includes(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
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
                <div className="recipe-card-actions">
                  <form action={deleteRecipe}>
                    <input type="hidden" name="id" value={recipe.id} />
                    <DeleteRecipeButton name={recipe.name} />
                  </form>
                  {(recipe.tags ?? []).length > 0 ? (
                    <ul className="chip-list recipe-tag-list">
                      {recipe.tags.map((tag) => (
                        <li className="chip" key={tag}>
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
