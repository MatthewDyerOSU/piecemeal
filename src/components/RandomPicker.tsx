"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  pickRandomRecipe,
  type RandomPickState,
} from "@/app/recipes/actions";

const initialState: RandomPickState = { status: "idle" };

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "healthy", label: "Healthy" },
  { value: "quick", label: "Quick" },
  { value: "easy", label: "Easy" },
  { value: "not-healthy", label: "Not healthy" },
  { value: "not-quick", label: "Not quick" },
  { value: "not-easy", label: "Not easy" },
];

/**
 * The random dinner picker: optional tag checkboxes plus a button that
 * reveals the picked recipe as a link below it — no navigation, so
 * pressing the button again re-rolls immediately. The result lives in a
 * polite live region, announced to screen readers while focus stays on
 * the button.
 */
export default function RandomPicker() {
  const [state, formAction, pending] = useActionState(
    pickRandomRecipe,
    initialState
  );

  return (
    <form action={formAction}>
      <fieldset>
        <legend className="visually-hidden">
          Only pick from recipes tagged
        </legend>
        <div className="checkbox-list">
          {FILTER_OPTIONS.map((option) => (
            <label key={option.value} className="checkbox-option">
              <input type="checkbox" name="filter" value={option.value} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <p>
        <button type="submit" className="button" disabled={pending}>
          {pending
            ? "Picking…"
            : state.status === "idle"
              ? "Just decide for us"
              : "Pick again"}
        </button>
      </p>
      <div aria-live="polite" className="picked-result">
        {state.status === "picked" ? (
          <p>
            How about{" "}
            <Link href={`/recipes/${state.id}`}>{state.name}</Link>?
          </p>
        ) : state.status === "none" ? (
          <p>
            There were no recipes to pick from. Try different tags, or{" "}
            <Link href="/recipes/new">add a recipe</Link>.
          </p>
        ) : null}
      </div>
    </form>
  );
}
