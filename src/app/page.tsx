import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { parseIngredients, recipeMatches } from "@/lib/recipes";
import type { Recipe } from "@/types/recipe";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ ingredients?: string }>;
}) {
  const { ingredients: query = "" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="page-narrow">
        <h1>PieceMeal</h1>
        <p>
          Decide what to cook with what you already have. Save your recipes,
          then search them by the ingredients in your kitchen.
        </p>
        <ul>
          <li>Save recipes with their ingredients and instructions.</li>
          <li>Search your saved recipes by the ingredients on hand.</li>
          <li>Use cooking mode to keep your screen awake while you cook.</li>
        </ul>
        <p>
          <Link href="/login" className="button">
            Sign in to get started
          </Link>
        </p>
      </section>
    );
  }

  const searchedTerms = parseIngredients(query);
  let matches: Recipe[] = [];
  let loadError: string | null = null;

  if (searchedTerms.length > 0) {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      loadError = error.message;
    } else {
      matches = ((data as Recipe[]) ?? []).filter((recipe) =>
        recipeMatches(recipe.ingredients, searchedTerms)
      );
    }
  }

  return (
    <>
      <h1>Find recipes</h1>
      <p>
        Search your saved recipes for ones that use the ingredients you have
        on hand.
      </p>

      <form role="search" method="get" action="/" className="field">
        <label htmlFor="ingredients">Ingredients you have</label>
        <p className="field-help" id="ingredients-help">
          Separate ingredients with commas. For example: eggs, flour, milk.
        </p>
        <input
          type="search"
          id="ingredients"
          name="ingredients"
          defaultValue={query}
          aria-describedby="ingredients-help"
          autoComplete="off"
        />
        <p>
          <button type="submit" className="button">
            Search recipes
          </button>
        </p>
      </form>

      {loadError ? (
        <p role="alert" className="alert alert-error">
          Could not load your recipes: {loadError}
        </p>
      ) : null}

      {searchedTerms.length > 0 && !loadError ? (
        <section aria-labelledby="results-heading">
          <h2 id="results-heading">
            {matches.length === 0
              ? "No matching recipes"
              : `${matches.length} matching ${
                  matches.length === 1 ? "recipe" : "recipes"
                }`}
          </h2>
          {matches.length === 0 ? (
            <p>
              None of your saved recipes use all of:{" "}
              {searchedTerms.join(", ")}. Try fewer ingredients, or{" "}
              <Link href="/recipes/new">add a new recipe</Link>.
            </p>
          ) : (
            <ul>
              {matches.map((recipe) => (
                <li key={recipe.id}>
                  <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}
