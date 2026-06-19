import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Recipe, RecipeComment } from "@/types/recipe";
import { allIngredients, formatMinutes } from "@/lib/recipes";
import CookingMode from "@/components/CookingMode";
import AddToShoppingList from "@/components/AddToShoppingList";
import RecipeComments from "@/components/RecipeComments";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const recipe = data as Recipe | null;
  if (!recipe) {
    notFound();
  }

  const { data: commentData } = await supabase
    .from("recipe_comments")
    .select("*")
    .eq("recipe_id", recipe.id)
    .order("created_at", { ascending: true });
  const comments = (commentData as RecipeComment[]) ?? [];

  const facts = [
    recipe.servings ? `Serves ${recipe.servings}` : null,
    formatMinutes(recipe.total_minutes),
  ].filter((part): part is string => Boolean(part));

  return (
    <article className="page-narrow">
      <p>
        <Link href="/recipes">Back to saved recipes</Link>
      </p>

      <div className="title-row">
        <h1>{recipe.name}</h1>
        <CookingMode />
      </div>

      {(recipe.tags ?? []).length > 0 ? (
        <ul className="tag-list">
          {recipe.tags.map((tag) => (
            <li className={`tag-pill pill-${tag}`} key={tag}>
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      {facts.length > 0 ? (
        <p className="recipe-facts recipe-facts-detail">{facts.join(" · ")}</p>
      ) : null}

      <AddToShoppingList items={allIngredients(recipe.ingredients)} />

      <section aria-labelledby="ingredients-heading">
        <h2 className="eyebrow" id="ingredients-heading">
          Ingredients
        </h2>
        {recipe.ingredients.length === 0 ? (
          <p>No ingredients were added for this recipe.</p>
        ) : recipe.ingredients.length === 1 && !recipe.ingredients[0].name ? (
          <ul>
            {recipe.ingredients[0].items.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        ) : (
          recipe.ingredients.map((group, groupIndex) => (
            <section key={groupIndex}>
              <h3>{group.name || "Other ingredients"}</h3>
              <ul>
                {group.items.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </section>
          ))
        )}
      </section>

      <section aria-labelledby="instructions-heading">
        <h2 className="eyebrow" id="instructions-heading">
          Instructions
        </h2>
        {recipe.instructions.length === 0 ? (
          <p>No instructions were added for this recipe.</p>
        ) : (
          <ol>
            {recipe.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        )}
      </section>

      <RecipeComments
        recipeId={recipe.id}
        comments={comments}
        currentUserId={user.id}
        isOwner={recipe.user_id === user.id}
      />
    </article>
  );
}
