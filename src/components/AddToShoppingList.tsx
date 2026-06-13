"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addToShoppingList } from "@/app/shopping-list/actions";

/**
 * Button on a recipe page that adds all of the recipe's ingredients to
 * the shopping list, then confirms (with a link to the list) in a polite
 * live region — no navigation, so the user stays on the recipe.
 */
export default function AddToShoppingList({ items }: { items: string[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      const { added } = await addToShoppingList(items);
      setMessage(
        added === 0
          ? "There were no ingredients to add."
          : `Added ${added} ${added === 1 ? "item" : "items"} to your shopping list.`
      );
    });
  }

  return (
    <div className="add-to-shopping">
      <button
        type="button"
        className="button button-secondary"
        onClick={add}
        disabled={pending}
      >
        {pending ? "Adding…" : "Add to shopping list"}
      </button>
      <p aria-live="polite" className="add-to-shopping-status">
        {message ? (
          <>
            {message} <Link href="/shopping-list">View shopping list</Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
