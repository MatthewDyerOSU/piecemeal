"use client";

import { useActionState, useEffect, useRef } from "react";
import { createRecipe, type RecipeFormState } from "@/app/recipes/actions";
import { RECIPE_TAGS } from "@/lib/recipes";
import ItemListEditor from "@/components/ItemListEditor";
import IngredientGroupsEditor from "@/components/IngredientGroupsEditor";

const initialState: RecipeFormState = { errors: {} };

const TAG_LABELS: Record<string, string> = {
  healthy: "Healthy",
  quick: "Quick",
  easy: "Easy",
};

export default function NewRecipeForm() {
  const [state, formAction, pending] = useActionState(
    createRecipe,
    initialState
  );
  const { errors } = state;

  // All errors are announced together in the summary live region at the
  // top of the form; each entry knows which field to send focus to.
  const errorEntries = [
    errors.name ? { id: "recipe-name", message: errors.name } : null,
    errors.ingredients
      ? { id: "recipe-ingredients", message: errors.ingredients }
      : null,
    errors.form ? { id: null, message: errors.form } : null,
  ].filter((entry) => entry !== null);

  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const firstField = errorEntries.find((entry) => entry.id);
    if (firstField?.id) {
      document.getElementById(firstField.id)?.focus();
    }
    // Refocus on every failed submission, not only when messages change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} noValidate>
      <p className="field-help">
        Required fields are marked with an asterisk (*).
      </p>

      <div ref={summaryRef} aria-live="assertive" role="alert">
        {errorEntries.length > 0 ? (
          <div className="alert alert-error">
            <p>
              The recipe was not saved because of{" "}
              {errorEntries.length === 1 ? "a problem" : "problems"} with the
              form:
            </p>
            <ul>
              {errorEntries.map((entry) => (
                <li key={entry.message}>{entry.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="recipe-name">
          Recipe name <span aria-hidden="true">*</span>
        </label>
        <input
          type="text"
          id="recipe-name"
          name="recipe-name"
          required
          aria-required="true"
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
        />
      </div>

      <IngredientGroupsEditor
        error={errors.ingredients}
        inputId="recipe-ingredients"
      />

      <ItemListEditor
        label="Instructions"
        noun="step"
        name="steps"
        help="Add the steps one at a time, in order. They are saved as a numbered list."
        ordered
        allowPaste
      />

      <fieldset className="field">
        <legend>Tags</legend>
        <p className="field-help" id="recipe-tags-help">
          Optional. Tags can be used to filter recipes and to narrow the
          random dinner picker.
        </p>
        <div className="checkbox-list" aria-describedby="recipe-tags-help">
          {RECIPE_TAGS.map((tag) => (
            <label key={tag} className="checkbox-option">
              <input type="checkbox" name="tags" value={tag} />
              {TAG_LABELS[tag]}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="button" disabled={pending}>
        {pending ? "Saving…" : "Save recipe"}
      </button>
    </form>
  );
}
