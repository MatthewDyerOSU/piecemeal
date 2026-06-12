import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewRecipeForm from "@/components/NewRecipeForm";

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

  return (
    <section className="page-narrow">
      <h1>Add a recipe</h1>
      <NewRecipeForm />
    </section>
  );
}
