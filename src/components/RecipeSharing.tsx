"use client";

import { useState, useTransition } from "react";
import { setRecipeShare } from "@/app/recipes/actions";

export type ShareHousehold = { id: string; name: string };

/**
 * Immediate per-household sharing control for the edit page: each of the
 * user's households shows its current state and an Add or Remove button
 * that takes effect right away (separate from saving the recipe's
 * content). State is conveyed by text + button label, not color alone.
 */
export default function RecipeSharing({
  recipeId,
  households,
  initialSharedIds,
  otherHouseholdCount,
}: {
  recipeId: string;
  households: ShareHousehold[];
  initialSharedIds: string[];
  otherHouseholdCount: number;
}) {
  const [shared, setShared] = useState<string[]>(initialSharedIds);
  const [announcement, setAnnouncement] = useState("");
  const [, startTransition] = useTransition();

  function toggle(household: ShareHousehold) {
    const isShared = shared.includes(household.id);
    setShared((previous) =>
      isShared
        ? previous.filter((id) => id !== household.id)
        : [...previous, household.id]
    );
    setAnnouncement(
      isShared
        ? `Removed from ${household.name}.`
        : `Shared with ${household.name}.`
    );
    startTransition(() =>
      setRecipeShare(recipeId, household.id, !isShared)
    );
  }

  return (
    <section className="sharing-section" aria-labelledby="sharing-heading">
      <h2 className="eyebrow" id="sharing-heading">
        Sharing
      </h2>

      {households.length === 0 ? (
        <p className="field-help">
          You aren&apos;t in any households, so this recipe is private to
          you. Join a household to share it.
        </p>
      ) : (
        <>
          <p className="field-help">
            Add or remove this recipe from your households. Changes take
            effect immediately. You always keep access.
          </p>
          <p aria-live="polite" className="visually-hidden">
            {announcement}
          </p>
          <ul className="sharing-list">
            {households.map((household) => {
              const isShared = shared.includes(household.id);
              return (
                <li key={household.id}>
                  <span className="sharing-row">
                    <span className="sharing-name">{household.name}</span>
                    <span className="sharing-status">
                      {isShared ? "Shared" : "Not shared"}
                    </span>
                    <button
                      type="button"
                      className={`button button-compact ${
                        isShared ? "button-danger" : "button-secondary"
                      }`}
                      onClick={() => toggle(household)}
                    >
                      {isShared ? "Remove" : "Add"}
                      <span className="visually-hidden"> {household.name}</span>
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {otherHouseholdCount > 0 ? (
        <p className="field-help">
          Also shared with {otherHouseholdCount} household
          {otherHouseholdCount === 1 ? "" : "s"} you&apos;re not part of.
        </p>
      ) : null}
    </section>
  );
}
