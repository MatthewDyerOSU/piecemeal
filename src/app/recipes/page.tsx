import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/types/recipe";
import DeleteRecipeButton from "@/components/DeleteRecipeButton";
import { deleteRecipe } from "./actions";

export const metadata: Metadata = {
  title: "Saved recipes",
};

export default async function RecipesPage() {
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

  const recipes = (data as Recipe[]) ?? [];

  return (
    <>
      <h1>Saved recipes</h1>

      {error ? (
        <p role="alert" className="alert alert-error">
          Could not load your recipes: {error.message}
        </p>
      ) : recipes.length === 0 ? (
        <p>
          You have no saved recipes yet.{" "}
          <Link href="/recipes/new">Add your first recipe</Link>.
        </p>
      ) : (
        <ul className="recipe-grid">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <article className="card recipe-card">
                <h2>
                  <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>
                </h2>
                <p className="recipe-meta">
                  {recipe.ingredients.length}{" "}
                  {recipe.ingredients.length === 1
                    ? "ingredient"
                    : "ingredients"}
                  : {recipe.ingredients.join(", ")}
                </p>
                <div className="recipe-card-actions">
                  <form action={deleteRecipe}>
                    <input type="hidden" name="id" value={recipe.id} />
                    <DeleteRecipeButton name={recipe.name} />
                  </form>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
