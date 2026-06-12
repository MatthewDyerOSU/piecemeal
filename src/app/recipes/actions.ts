"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  matchesTagFilters,
  parseIngredients,
  RECIPE_TAGS,
  sanitizeTagFilters,
} from "@/lib/recipes";
import type { IngredientGroup } from "@/types/recipe";

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

/**
 * Ingredient groups arrive as JSON from the IngredientGroupsEditor (which
 * already includes typed-but-not-added drafts). Without JavaScript only
 * the plain `ingredients-draft` text box submits; it is comma-split into
 * a single unnamed group.
 */
function parseIngredientGroups(formData: FormData): IngredientGroup[] {
  const raw = formData.get("ingredients-json");
  if (typeof raw === "string" && raw.length > 0) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((group) => ({
            name: String(
              (group as { name?: unknown })?.name ?? ""
            ).trim(),
            items: Array.isArray((group as { items?: unknown })?.items)
              ? ((group as { items: unknown[] }).items as unknown[])
                  .map((item) => String(item).trim())
                  .filter((item) => item.length > 0)
              : [],
          }))
          .filter((group) => group.items.length > 0);
      }
    } catch {
      // Malformed JSON: treat as no ingredients; validation reports it.
    }
    return [];
  }

  const draft = parseIngredients(
    String(formData.get("ingredients-draft") ?? "")
  );
  return draft.length > 0 ? [{ name: "", items: draft }] : [];
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

  // The field is named recipe-name (not "name") so browsers and password
  // managers stop offering contact autofill for it.
  const name = String(formData.get("recipe-name") ?? "").trim();

  const tags = formData
    .getAll("tags")
    .map((value) => String(value))
    .filter((value) => (RECIPE_TAGS as readonly string[]).includes(value));

  const ingredients = parseIngredientGroups(formData);

  // Committed steps, plus whatever is still typed in the entry box so it
  // is not lost on save.
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
    tags,
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

export type RandomPickState =
  | { status: "idle" }
  | { status: "none" }
  | { status: "picked"; id: string; name: string };

export async function pickRandomRecipe(
  _previous: RandomPickState,
  formData: FormData
): Promise<RandomPickState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const filters = sanitizeTagFilters(
    formData.getAll("filter").map((value) => String(value))
  );

  const { data } = await supabase.from("recipes").select("id, name, tags");
  const candidates = (
    (data as { id: string; name: string; tags: string[] }[]) ?? []
  ).filter((recipe) => matchesTagFilters(recipe.tags ?? [], filters));

  if (candidates.length === 0) {
    return { status: "none" };
  }

  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  return { status: "picked", id: choice.id, name: choice.name };
}
