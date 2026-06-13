"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  matchesTagFilters,
  parseIngredients,
  RECIPE_TAGS,
  sanitizeTagFilters,
} from "@/lib/recipes";
import type { IngredientGroup } from "@/types/recipe";

/** Household ids the current user belongs to. */
async function userHouseholdIds(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data } = await supabase.from("households").select("id");
  return ((data as { id: string }[]) ?? []).map((h) => h.id);
}

/**
 * Set a recipe's household shares to `selected`, but only among the user's
 * own households — shares to households the user isn't in are left intact,
 * so one member can't silently revoke another household's access.
 */
async function reconcileRecipeShares(
  supabase: SupabaseClient,
  recipeId: string,
  selected: string[]
) {
  const mine = await userHouseholdIds(supabase);
  const keep = selected.filter((id) => mine.includes(id));
  const remove = mine.filter((id) => !keep.includes(id));

  if (remove.length > 0) {
    await supabase
      .from("recipe_households")
      .delete()
      .eq("recipe_id", recipeId)
      .in("household_id", remove);
  }
  if (keep.length > 0) {
    await supabase.from("recipe_households").upsert(
      keep.map((household_id) => ({ recipe_id: recipeId, household_id })),
      { onConflict: "recipe_id,household_id", ignoreDuplicates: true }
    );
  }
}

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

function parseRecipeForm(formData: FormData) {
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

  return { name, tags, ingredients, steps, errors };
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

  const { name, tags, ingredients, steps, errors } =
    parseRecipeForm(formData);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const { data: inserted, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      name,
      ingredients,
      instructions: steps,
      tags,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return {
      errors: { form: `Could not save the recipe: ${error?.message ?? ""}` },
    };
  }

  await reconcileRecipeShares(
    supabase,
    (inserted as { id: string }).id,
    formData.getAll("households").map(String)
  );

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function updateRecipe(
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

  const recipeId = String(formData.get("recipe-id") ?? "");
  if (!recipeId) {
    return { errors: { form: "Could not tell which recipe to update." } };
  }

  // Editing a recipe's content is owner-only. RLS enforces this too (a
  // non-owner update simply matches no rows), but checking here lets us
  // report it clearly instead of silently "succeeding".
  const { data: existing } = await supabase
    .from("recipes")
    .select("user_id")
    .eq("id", recipeId)
    .maybeSingle();
  if (!existing) {
    return { errors: { form: "That recipe no longer exists." } };
  }
  if ((existing as { user_id: string }).user_id !== user.id) {
    return {
      errors: { form: "Only the recipe's owner can edit it." },
    };
  }

  const { name, tags, ingredients, steps, errors } =
    parseRecipeForm(formData);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const { error } = await supabase
    .from("recipes")
    .update({ name, ingredients, instructions: steps, tags })
    .eq("id", recipeId);

  if (error) {
    return {
      errors: { form: `Could not save the recipe: ${error.message}` },
    };
  }

  // Sharing is managed separately on the edit page (immediate actions), so
  // updating recipe content no longer touches the share list.
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  redirect(`/recipes/${recipeId}`);
}

/**
 * Add or remove a recipe from a single household, taking effect
 * immediately. RLS restricts this to households the user belongs to and
 * recipes they can access.
 */
export async function setRecipeShare(
  recipeId: string,
  householdId: string,
  shared: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  if (shared) {
    await supabase
      .from("recipe_households")
      .upsert(
        { recipe_id: recipeId, household_id: householdId },
        { onConflict: "recipe_id,household_id", ignoreDuplicates: true }
      );
  } else {
    await supabase
      .from("recipe_households")
      .delete()
      .eq("recipe_id", recipeId)
      .eq("household_id", householdId);
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/recipes/${recipeId}/edit`);
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
  redirect("/recipes");
}

export type CommentFormState = {
  /** Set after a successful post so the form can clear and refocus. */
  ok?: boolean;
  error?: string;
};

/**
 * Add a comment to a recipe. Anyone who can access the recipe may comment;
 * the database function enforces access and records the author's name.
 */
export async function addRecipeComment(
  _previousState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const recipeId = String(formData.get("recipe-id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!recipeId) {
    return { error: "Could not tell which recipe to comment on." };
  }
  if (!body) {
    return { error: "Enter a comment before posting." };
  }

  const { error } = await supabase.rpc("add_recipe_comment", {
    rid: recipeId,
    comment_body: body,
  });
  if (error) {
    return { error: `Could not post your comment: ${error.message}` };
  }

  revalidatePath(`/recipes/${recipeId}`);
  return { ok: true };
}

/**
 * Remove a comment. RLS restricts this to the comment's author and the
 * recipe's owner.
 */
export async function deleteRecipeComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("comment-id") ?? "");
  const recipeId = String(formData.get("recipe-id") ?? "");
  if (id) {
    await supabase.from("recipe_comments").delete().eq("id", id);
  }
  if (recipeId) {
    revalidatePath(`/recipes/${recipeId}`);
  }
}

export type RandomPickState =
  | { status: "idle" }
  | { status: "none" }
  | { status: "picked"; id: string; name: string };

export async function pickRandomRecipe(
  previous: RandomPickState,
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

  // Never serve the same recipe twice in a row (unless it is the only
  // candidate). This also guarantees the live region's text changes, so
  // screen readers always announce a repeat press.
  const pool =
    previous.status === "picked" && candidates.length > 1
      ? candidates.filter((candidate) => candidate.id !== previous.id)
      : candidates;

  const choice = pool[Math.floor(Math.random() * pool.length)];
  return { status: "picked", id: choice.id, name: choice.name };
}
