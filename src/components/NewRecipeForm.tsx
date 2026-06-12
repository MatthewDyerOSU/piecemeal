"use client";

import { useActionState } from "react";
import { createRecipe, type RecipeFormState } from "@/app/recipes/actions";
import ItemListEditor from "@/components/ItemListEditor";
import IngredientGroupsEditor from "@/components/IngredientGroupsEditor";

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

      <IngredientGroupsEditor error={errors.ingredients} />

      <ItemListEditor
        label="Instructions"
        noun="step"
        name="steps"
        help="Add the steps one at a time, in order. They are saved as a numbered list."
        ordered
      />

      <button type="submit" className="button" disabled={pending}>
        {pending ? "Saving…" : "Save recipe"}
      </button>
    </form>
  );
}
