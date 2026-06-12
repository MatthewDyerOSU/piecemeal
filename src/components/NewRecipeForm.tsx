"use client";

import { useActionState } from "react";
import { createRecipe, type RecipeFormState } from "@/app/recipes/actions";

const initialState: RecipeFormState = { errors: {} };

export default function NewRecipeForm() {
  const [state, formAction, pending] = useActionState(
    createRecipe,
    initialState
  );
  const { errors } = state;

  return (
    <form action={formAction} noValidate>
      {errors.form ? (
        <p role="alert" className="alert alert-error">
          {errors.form}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="recipe-name">Recipe name</label>
        <input
          type="text"
          id="recipe-name"
          name="name"
          required
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "recipe-name-error" : undefined}
        />
        {errors.name ? (
          <p id="recipe-name-error" role="alert" className="field-error">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="recipe-ingredients">Ingredients</label>
        <p className="field-help" id="recipe-ingredients-help">
          Separate ingredients with commas. For example: eggs, flour, milk.
        </p>
        <input
          type="text"
          id="recipe-ingredients"
          name="ingredients"
          required
          aria-invalid={errors.ingredients ? true : undefined}
          aria-describedby={
            errors.ingredients
              ? "recipe-ingredients-help recipe-ingredients-error"
              : "recipe-ingredients-help"
          }
        />
        {errors.ingredients ? (
          <p
            id="recipe-ingredients-error"
            role="alert"
            className="field-error"
          >
            {errors.ingredients}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="recipe-instructions">Instructions</label>
        <p className="field-help" id="recipe-instructions-help">
          Optional. Press Enter to start a new step on its own line.
        </p>
        <textarea
          id="recipe-instructions"
          name="instructions"
          rows={8}
          aria-describedby="recipe-instructions-help"
        />
      </div>

      <button type="submit" className="button" disabled={pending}>
        {pending ? "Saving…" : "Save recipe"}
      </button>
    </form>
  );
}
