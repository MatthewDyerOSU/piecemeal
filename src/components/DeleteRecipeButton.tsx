"use client";

/**
 * Submit button for the delete-recipe form. Asks for confirmation before
 * submitting (WCAG 3.3.6 Error Prevention); without JavaScript the form
 * still submits and the recipe is deleted directly.
 */
export default function DeleteRecipeButton({ name }: { name: string }) {
  return (
    <button
      type="submit"
      className="button button-danger"
      onClick={(event) => {
        if (
          !window.confirm(
            `Delete the recipe "${name}"? This cannot be undone.`
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      Delete<span className="visually-hidden"> {name}</span>
    </button>
  );
}
