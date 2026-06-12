"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseIngredients } from "@/lib/recipes";

export type RecipeFormState = {
  errors: {
    name?: string;
    ingredients?: string;
    form?: string;
  };
};

export async function createRecipe(
  _previousState: RecipeFormState,
  formData: FormData
): Promise<RecipeFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const ingredients = parseIngredients(String(formData.get("ingredients") ?? ""));
  const instructions = String(formData.get("instructions") ?? "").trim();

  const errors: RecipeFormState["errors"] = {};
  if (!name) {
    errors.name = "Enter a name for the recipe.";
  }
  if (ingredients.length === 0) {
    errors.ingredients =
      "Enter at least one ingredient, separated by commas.";
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const { error } = await supabase.from("recipes").insert({
    user_id: user.id,
    name,
    ingredients,
    instructions,
  });

  if (error) {
    return {
      errors: { form: `Could not save the recipe: ${error.message}` },
    };
  }

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function deleteRecipe(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("recipes").delete().eq("id", id);
  }

  revalidatePath("/recipes");
}
