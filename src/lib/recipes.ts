import type { IngredientGroup } from "@/types/recipe";

/** Splits a comma-separated ingredient string into trimmed, non-empty terms. */
export function parseIngredients(input: string): string[] {
  return input
    .split(",")
    .map((term) => term.trim())
    .filter((term) => term.length > 0);
}

/** Flattens a recipe's ingredient groups into a single list of items. */
export function allIngredients(groups: IngredientGroup[]): string[] {
  return groups.flatMap((group) => group.items);
}

/**
 * A recipe matches when every searched term appears in at least one of the
 * recipe's ingredients (case-insensitive substring match).
 */
export function recipeMatches(
  recipeIngredients: string[],
  searchedTerms: string[]
): boolean {
  const lowered = recipeIngredients.map((i) => i.toLowerCase());
  return searchedTerms.every((term) =>
    lowered.some((ingredient) => ingredient.includes(term.toLowerCase()))
  );
}
