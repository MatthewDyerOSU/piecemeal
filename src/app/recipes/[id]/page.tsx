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

  const instructionSteps = recipe.instructions
    .split("\n")
    .map((step) => step.trim())
    .filter((step) => step.length > 0);

  return (
    <article className="page-narrow">
      <p>
        <Link href="/recipes">Back to saved recipes</Link>
      </p>

      <h1>{recipe.name}</h1>

      <CookingMode />

      <section aria-labelledby="ingredients-heading">
        <h2 className="eyebrow" id="ingredients-heading">
          Ingredients
        </h2>
        <ul>
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index}>{ingredient}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="instructions-heading">
        <h2 className="eyebrow" id="instructions-heading">
          Instructions
        </h2>
        {instructionSteps.length === 0 ? (
          <p>No instructions were added for this recipe.</p>
        ) : (
          instructionSteps.map((step, index) => <p key={index}>{step}</p>)
        )}
      </section>
    </article>
  );
}
