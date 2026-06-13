import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RecipeForm from "@/components/RecipeForm";

export const metadata: Metadata = {
  title: "Add a recipe",
};

export default async function NewRecipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: householdData } = await supabase
    .from("households")
    .select("id, name")
    .order("name");
  const households = (householdData as { id: string; name: string }[]) ?? [];

  return (
    <section className="page-narrow">
      <h1>Add a recipe</h1>
      <RecipeForm
        households={households}
        sharedHouseholdIds={households.map((h) => h.id)}
      />
    </section>
  );
}
