"use client";

/**
 * Submit button for the leave-household form. Asks for confirmation
 * before submitting (WCAG 3.3.6 Error Prevention).
 */
export default function LeaveHouseholdButton({ name }: { name: string }) {
  return (
    <button
      type="submit"
      className="button button-danger"
      onClick={(event) => {
        if (
          !window.confirm(
            `Leave "${name}"? Recipes you added stay yours, but you and this household's members will stop seeing each other's recipes.`
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      Leave household<span className="visually-hidden"> {name}</span>
    </button>
  );
}
