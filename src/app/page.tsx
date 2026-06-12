import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { allIngredients, parseIngredients, recipeMatches } from "@/lib/recipes";
import type { Recipe } from "@/types/recipe";
import SearchForm from "@/components/SearchForm";
import RandomPicker from "@/components/RandomPicker";

function toArray(value: string | string[] | undefined): string[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    ingredients?: string | string[];
    "ingredients-draft"?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="hero">
        <p className="eyebrow">Personal recipe manager</p>
        <h1>
          Cook with what
          <br />
          you <em>already</em> have.
        </h1>
        <p className="lede">
          Save your recipes, search them by the ingredients in your kitchen,
          and keep your screen awake while you cook.
        </p>
        <ul className="chip-list">
          {["Ingredient Search", "Saved Recipes", "Cooking Mode"].map(
            (feature) => (
              <li className="chip" key={feature}>
                {feature}
              </li>
            )
          )}
        </ul>
        <p>
          <Link href="/login" className="button">
            Sign in to get started
          </Link>
        </p>
      </section>
    );
  }

  // Committed list entries arrive as repeated `ingredients` params; the
  // text box itself submits as `ingredients-draft`. Each is also split on
  // commas so the form works without JavaScript.
  const searchedTerms = [
    ...toArray(params.ingredients),
    ...toArray(params["ingredients-draft"]),
  ].flatMap(parseIngredients);
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
        recipeMatches(allIngredients(recipe.ingredients), searchedTerms)
      );
    }
  }

  return (
    <>
      <h1>Find recipes</h1>

      <section aria-labelledby="decide-heading" className="decide">
        <h2 className="eyebrow" id="decide-heading">
          Can&apos;t decide?
        </h2>
        <p>
          Let Piece-Meal pick dinner at random from everything you and your
          household have saved.
        </p>
        <RandomPicker />
      </section>

      <section aria-labelledby="search-heading">
        <h2 className="eyebrow" id="search-heading">
          Search by ingredient
        </h2>
        <p>
          Search your saved recipes for ones that use the ingredients you
          have on hand.
        </p>

        <SearchForm
          key={searchedTerms.join(" ")}
          initialTerms={searchedTerms}
        />
      </section>

      {loadError ? (
        <p role="alert" className="alert alert-error">
          Could not load your recipes: {loadError}
        </p>
      ) : null}

      {searchedTerms.length > 0 && !loadError ? (
        <section aria-labelledby="results-heading">
          <h2 className="eyebrow" id="results-heading">
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
