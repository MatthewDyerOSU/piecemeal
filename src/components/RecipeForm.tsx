"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createRecipe,
  updateRecipe,
  type RecipeFormState,
} from "@/app/recipes/actions";
import type { Recipe } from "@/types/recipe";
import ItemListEditor from "@/components/ItemListEditor";
import IngredientGroupsEditor from "@/components/IngredientGroupsEditor";
import TagPills from "@/components/TagPills";

const initialState: RecipeFormState = { errors: {} };

/**
 * Shared create/edit recipe form. Error flow, designed with screen-reader
 * users in mind: on a failed submission focus moves straight into the
 * first erroring field (whose label and error are read immediately via
 * aria-describedby), each remaining invalid field announces its own error
 * when tabbed into, and a short list just before the submit button links
 * back to any fields still in error — entries disappear as fields are
 * fixed.
 */
export default function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const [state, formAction, pending] = useActionState(
    recipe ? updateRecipe : createRecipe,
    initialState
  );
  const { errors } = state;

  // Live "is it fixed yet" tracking, so the bottom list only shows what
  // is still broken.
  const [nameValue, setNameValue] = useState(recipe?.name ?? "");
  const [hasIngredients, setHasIngredients] = useState(
    Boolean(recipe && recipe.ingredients.length > 0)
  );

  const nameInvalid = Boolean(errors.name) && nameValue.trim() === "";
  const ingredientsInvalid = Boolean(errors.ingredients) && !hasIngredients;

  const remaining = [
    nameInvalid && errors.name
      ? { id: "recipe-name", message: errors.name }
      : null,
    ingredientsInvalid && errors.ingredients
      ? { id: "recipe-ingredients", message: errors.ingredients }
      : null,
  ].filter((entry) => entry !== null);

  const formErrorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errors.name) {
      document.getElementById("recipe-name")?.focus();
    } else if (errors.ingredients) {
      document.getElementById("recipe-ingredients")?.focus();
    } else if (errors.form) {
      formErrorRef.current?.focus();
    }
    // Refocus on every failed submission, not only when messages change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} noValidate>
      <p className="field-help">
        Required fields are marked with an asterisk (*).
      </p>

      {recipe ? (
        <input type="hidden" name="recipe-id" value={recipe.id} />
      ) : null}

      {errors.form ? (
        <div
          ref={formErrorRef}
          tabIndex={-1}
          role="alert"
          className="alert alert-error error-summary"
        >
          <p>{errors.form}</p>
        </div>
      ) : null}

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
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          aria-invalid={nameInvalid ? true : undefined}
          aria-describedby={nameInvalid ? "recipe-name-error" : undefined}
        />
        {nameInvalid ? (
          <p id="recipe-name-error" className="field-error">
            {errors.name}
          </p>
        ) : null}
      </div>

      <IngredientGroupsEditor
        error={ingredientsInvalid ? errors.ingredients : undefined}
        inputId="recipe-ingredients"
        onHasIngredientsChange={setHasIngredients}
        initialGroups={recipe?.ingredients}
      />

      <ItemListEditor
        label="Instructions"
        noun="step"
        name="steps"
        help="Add the steps one at a time, in order. They are saved as a numbered list."
        ordered
        allowPaste
        initialItems={recipe?.instructions}
      />

      <div className="field">
        <p className="field-label-like">Tags</p>
        <p className="field-help" id="recipe-tags-help">
          Optional. Tags can be used to filter recipes and to narrow the
          random dinner picker.
        </p>
        <TagPills
          name="tags"
          legend="Tags"
          describedBy="recipe-tags-help"
          defaultSelected={recipe?.tags ?? []}
        />
      </div>

      {remaining.length > 0 ? (
        <section
          aria-labelledby="remaining-errors-heading"
          className="alert alert-error error-summary"
        >
          <h2 id="remaining-errors-heading">Still needing attention</h2>
          <ul>
            {remaining.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(entry.id)?.focus();
                  }}
                >
                  {entry.message}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <button type="submit" className="button" disabled={pending}>
        {pending ? "Saving…" : recipe ? "Save changes" : "Save recipe"}
      </button>
    </form>
  );
}
