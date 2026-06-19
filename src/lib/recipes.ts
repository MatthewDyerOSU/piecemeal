import type { IngredientGroup } from "@/types/recipe";

export const RECIPE_TAGS = ["healthy", "quick", "easy"] as const;

/** Valid values for the saved-recipes filter: each tag and its negation. */
export const TAG_FILTERS = [
  ...RECIPE_TAGS,
  ...RECIPE_TAGS.map((tag) => `not-${tag}`),
];

export function sanitizeTagFilters(values: string[]): string[] {
  return values.filter((value) => TAG_FILTERS.includes(value));
}

/** True when the tags satisfy every filter ("easy" requires the tag,
    "not-easy" requires its absence). */
export function matchesTagFilters(
  tags: string[],
  filters: string[]
): boolean {
  return filters.every((filter) =>
    filter.startsWith("not-")
      ? !tags.includes(filter.slice(4))
      : tags.includes(filter)
  );
}

/** Free-text servings ("4", "2-4", "makes 12"); trimmed, capped, null when blank. */
export function parseServings(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text.slice(0, 50) : null;
}

/** Parse a positive whole number from form input; null when blank/invalid. */
export function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Format a duration in minutes as "45 min", "1 hr", or "1 hr 30 min". */
export function formatMinutes(total: number | null | undefined): string | null {
  if (!total || total <= 0) {
    return null;
  }
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} hr`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }
  return parts.join(" ");
}

/** Splits a comma-separated ingredient string into trimmed, non-empty terms. */
export function parseIngredients(input: string): string[] {
  return input
    .split(",")
    .map((term) => term.trim())
    .filter((term) => term.length > 0);
}

/**
 * Splits pasted multi-line text into list items, one per line, stripping
 * leading list markers: bullets (•, -, *, …), "1." / "1)" numbering, and
 * "Step 1:" prefixes. A bare leading number with no punctuation is kept —
 * it is a quantity ("2 eggs"), not numbering.
 */
export function parseListLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s*(?:step\s+\d+\s*[.:)]\s*|\d+\s*[.)]\s*|[•▪◦‣·*–—-]+\s*)?/i, "")
        .trim()
    )
    .filter((line) => line.length > 0);
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
