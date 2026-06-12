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

function listValues(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
}

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

  // Committed list items, plus whatever is still typed in the entry boxes.
  // The ingredient draft is comma-split so the form stays usable without
  // JavaScript (where the add buttons do nothing).
  const ingredients = [
    ...listValues(formData, "ingredients"),
    ...parseIngredients(String(formData.get("ingredients-draft") ?? "")),
  ];
  const steps = listValues(formData, "steps");
  const stepDraft = String(formData.get("steps-draft") ?? "").trim();
  if (stepDraft) {
    steps.push(stepDraft);
  }

  const errors: RecipeFormState["errors"] = {};
  if (!name) {
    errors.name = "Enter a name for the recipe.";
  }
  if (ingredients.length === 0) {
    errors.ingredients = "Add at least one ingredient.";
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const { error } = await supabase.from("recipes").insert({
    user_id: user.id,
    name,
    ingredients,
    instructions: steps,
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
