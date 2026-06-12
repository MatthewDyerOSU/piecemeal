"use client";

import ItemListEditor from "@/components/ItemListEditor";

/**
 * Ingredient search as a GET form: committed ingredients submit as repeated
 * `ingredients` params (plus whatever is still typed in the box as
 * `ingredients-draft`), so results have shareable URLs. Without JavaScript
 * the text box alone still works — the server also splits entries on commas.
 */
export default function SearchForm({
  initialTerms,
}: {
  initialTerms: string[];
}) {
  return (
    <form role="search" method="get" action="/">
      <ItemListEditor
        label="Ingredients you have"
        noun="ingredient"
        name="ingredients"
        help="Add ingredients one at a time. Recipes that use all of them will match."
        initialItems={initialTerms}
      />
      <p>
        <button type="submit" className="button">
          Search recipes
        </button>
      </p>
    </form>
  );
}
