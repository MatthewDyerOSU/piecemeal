import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/types/recipe";
import RecipeForm from "@/components/RecipeForm";

export const metadata: Metadata = {
  title: "Edit recipe",
};

export default async function EditRecipePage({
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
    <section className="page-narrow">
      <p>
        <Link href={`/recipes/${recipe.id}`}>Back to {recipe.name}</Link>
      </p>
      <h1>Edit {recipe.name}</h1>
      <RecipeForm recipe={recipe} />
    </section>
  );
}
