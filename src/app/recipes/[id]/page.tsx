import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/types/recipe";
import CookingMode from "@/components/CookingMode";

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

  return (
    <article className="page-narrow">
      <p>
        <Link href="/recipes">Back to saved recipes</Link>
      </p>

      <h1>{recipe.name}</h1>

      {(recipe.tags ?? []).length > 0 ? (
        <ul className="chip-list recipe-tag-list">
          {recipe.tags.map((tag) => (
            <li className="chip" key={tag}>
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      <CookingMode />

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
    </article>
  );
}
