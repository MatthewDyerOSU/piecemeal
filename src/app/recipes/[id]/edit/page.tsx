import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/types/recipe";
import RecipeForm from "@/components/RecipeForm";
import RecipeSharing from "@/components/RecipeSharing";

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

  const [{ data: householdData }, { data: shareData }] = await Promise.all([
    supabase.from("households").select("id, name").order("name"),
    supabase
      .from("recipe_households")
      .select("household_id")
      .eq("recipe_id", recipe.id),
  ]);
  const households = (householdData as { id: string; name: string }[]) ?? [];
  const sharedHouseholdIds = (
    (shareData as { household_id: string }[]) ?? []
  ).map((row) => row.household_id);

  const myHouseholdIds = new Set(households.map((h) => h.id));
  const sharedMine = sharedHouseholdIds.filter((id) => myHouseholdIds.has(id));
  const otherHouseholdCount = sharedHouseholdIds.length - sharedMine.length;
  const isOwner = recipe.user_id === user.id;

  return (
    <section className="page-narrow">
      <p>
        <Link href={`/recipes/${recipe.id}`}>Back to {recipe.name}</Link>
      </p>
      <h1>Edit {recipe.name}</h1>
      <RecipeForm recipe={recipe} isOwner={isOwner} />
      <RecipeSharing
        recipeId={recipe.id}
        households={households}
        initialSharedIds={sharedMine}
        otherHouseholdCount={otherHouseholdCount}
      />
    </section>
  );
}
