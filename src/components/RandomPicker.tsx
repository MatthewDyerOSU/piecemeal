"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  pickRandomRecipe,
  type RandomPickState,
} from "@/app/recipes/actions";
import TagPills from "@/components/TagPills";

const initialState: RandomPickState = { status: "idle" };

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
  // Controlled: React resets uncontrolled fields after each server-action
  // submission, which would untoggle the pills on every pick.
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  return (
    <form action={formAction}>
      <TagPills
        name="filter"
        legend="Only pick from recipes tagged"
        selected={selectedTags}
        onToggle={(tag) =>
          setSelectedTags((previous) =>
            previous.includes(tag)
              ? previous.filter((t) => t !== tag)
              : [...previous, tag]
          )
        }
      />
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
          <div className="card picked-card">
            <p className="picked-lede">How about…</p>
            <p className="picked-name">
              <Link href={`/recipes/${state.id}`}>{state.name}</Link>
            </p>
          </div>
        ) : state.status === "none" ? (
          <div className="card picked-card">
            <p>
              There were no recipes to pick from. Try different tags, or{" "}
              <Link href="/recipes/new">add a recipe</Link>.
            </p>
          </div>
        ) : null}
      </div>
    </form>
  );
}
